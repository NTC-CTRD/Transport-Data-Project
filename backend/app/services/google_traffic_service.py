import os

import httpx
from dotenv import load_dotenv


load_dotenv()


GOOGLE_MAPS_API_KEY = os.getenv(
    "GOOGLE_MAPS_API_KEY"
)


ROUTES_URL = (
    "https://routes.googleapis.com/"
    "directions/v2:computeRoutes"
)


async def get_traffic_route(
    stops: list[dict],
):
    """
    Calculate a traffic-aware route through
    all corridor stops in their defined order.

    Minimum stops: 2
    Maximum stops: 10

    Returns:
        - Whole-corridor distance
        - Whole-corridor traffic duration
        - Whole-corridor static duration
        - Individual stop-to-stop segment information
    """

    # ========================================================
    # VALIDATION
    # ========================================================

    if not GOOGLE_MAPS_API_KEY:
        raise RuntimeError(
            "GOOGLE_MAPS_API_KEY is not configured."
        )

    if len(stops) < 2:
        raise ValueError(
            "At least 2 stops are required."
        )

    if len(stops) > 10:
        raise ValueError(
            "A maximum of 10 stops is allowed."
        )


    # ========================================================
    # ORIGIN
    # ========================================================

    first_stop = stops[0]

    origin = {
        "location": {
            "latLng": {
                "latitude": first_stop["latitude"],
                "longitude": first_stop["longitude"],
            }
        }
    }


    # ========================================================
    # DESTINATION
    # ========================================================

    last_stop = stops[-1]

    destination = {
        "location": {
            "latLng": {
                "latitude": last_stop["latitude"],
                "longitude": last_stop["longitude"],
            }
        }
    }


    # ========================================================
    # INTERMEDIATE STOPS
    #
    # IMPORTANT:
    # Do not use "via": True here.
    #
    # These are actual corridor stops, so Google returns
    # separate route legs between each consecutive stop.
    # ========================================================

    intermediates = []

    for stop in stops[1:-1]:

        intermediates.append(
            {
                "location": {
                    "latLng": {
                        "latitude": stop["latitude"],
                        "longitude": stop["longitude"],
                    }
                }
            }
        )


    # ========================================================
    # GOOGLE ROUTES API REQUEST
    # ========================================================

    payload = {
        "origin": origin,

        "destination": destination,

        "intermediates": intermediates,

        "travelMode": "DRIVE",

        "routingPreference": "TRAFFIC_AWARE",

        "computeAlternativeRoutes": False,

        "languageCode": "en-US",

        "units": "METRIC",
    }


    # ========================================================
    # RESPONSE FIELD MASK
    #
    # We now request:
    #
    # Whole route:
    #   distance
    #   duration
    #   staticDuration
    #
    # Every route leg:
    #   distance
    #   duration
    #   staticDuration
    # ========================================================

    headers = {
        "Content-Type": "application/json",

        "X-Goog-Api-Key": (
            GOOGLE_MAPS_API_KEY
        ),

        "X-Goog-FieldMask": (
            "routes.distanceMeters,"
            "routes.duration,"
            "routes.staticDuration,"
            "routes.legs.distanceMeters,"
            "routes.legs.duration,"
            "routes.legs.staticDuration"
        ),
    }


    # ========================================================
    # CALL GOOGLE
    # ========================================================

    async with httpx.AsyncClient(
        timeout=30.0
    ) as client:

        response = await client.post(
            ROUTES_URL,
            json=payload,
            headers=headers,
        )


    # ========================================================
    # HANDLE GOOGLE ERRORS
    # ========================================================

    if response.status_code != 200:

        raise RuntimeError(
            "Google Routes API error: "
            f"{response.status_code} "
            f"{response.text}"
        )


    data = response.json()

    routes = data.get(
        "routes",
        []
    )


    if not routes:

        raise RuntimeError(
            "Google returned no routes "
            "through all corridor stops."
        )


    route = routes[0]


    # ========================================================
    # WHOLE-CORRIDOR VALUES
    # ========================================================

    distance_meters = route.get(
        "distanceMeters"
    )

    duration = route.get(
        "duration"
    )

    static_duration = route.get(
        "staticDuration"
    )


    # ========================================================
    # BUILD SEGMENT DATA
    #
    # Example:
    #
    # Stop 1 → Stop 2
    # Stop 2 → Stop 3
    # Stop 3 → Stop 4
    #
    # Google returns one leg for each section because
    # our intermediate waypoints are non-via stops.
    # ========================================================

    segments = []

    route_legs = route.get(
        "legs",
        []
    )


    for index, leg in enumerate(
        route_legs
    ):

        # ----------------------------------------------------
        # Make sure a corresponding pair of stops exists.
        # ----------------------------------------------------

        if index >= len(stops) - 1:
            break


        from_stop = stops[index]

        to_stop = stops[index + 1]


        # ----------------------------------------------------
        # Leg values
        # ----------------------------------------------------

        leg_distance_meters = (
            leg.get("distanceMeters")
        )

        leg_duration = (
            leg.get("duration")
        )

        leg_static_duration = (
            leg.get("staticDuration")
        )


        # ----------------------------------------------------
        # Convert values
        # ----------------------------------------------------

        leg_distance_km = (

            leg_distance_meters / 1000

            if leg_distance_meters
            is not None

            else None
        )


        traffic_seconds = (

            _duration_to_seconds(
                leg_duration
            )

            if leg_duration
            else None
        )


        static_seconds = (

            _duration_to_seconds(
                leg_static_duration
            )

            if leg_static_duration
            else None
        )


        # ----------------------------------------------------
        # Segment travel time
        # ----------------------------------------------------

        travel_time_minutes = (

            traffic_seconds / 60

            if traffic_seconds
            is not None

            else None
        )


        # ----------------------------------------------------
        # Segment average speed
        # ----------------------------------------------------

        average_speed_kmh = None


        if (
            leg_distance_km is not None
            and traffic_seconds is not None
            and traffic_seconds > 0
        ):

            average_speed_kmh = (

                leg_distance_km
                / (traffic_seconds / 3600)

            )


        # ----------------------------------------------------
        # Store segment
        # ----------------------------------------------------

        segments.append(
            {
                "sequence_order": index + 1,

                "from_stop": {
                    "name": from_stop["name"],
                    "latitude": from_stop["latitude"],
                    "longitude": from_stop["longitude"],
                    "sequence_order": from_stop[
                        "sequence_order"
                    ],
                },

                "to_stop": {
                    "name": to_stop["name"],
                    "latitude": to_stop["latitude"],
                    "longitude": to_stop["longitude"],
                    "sequence_order": to_stop[
                        "sequence_order"
                    ],
                },

                "distance_km": (
                    round(
                        leg_distance_km,
                        3
                    )
                    if leg_distance_km
                    is not None
                    else None
                ),

                "traffic_duration_seconds": (
                    round(
                        traffic_seconds,
                        2
                    )
                    if traffic_seconds
                    is not None
                    else None
                ),

                "static_duration_seconds": (
                    round(
                        static_seconds,
                        2
                    )
                    if static_seconds
                    is not None
                    else None
                ),

                "travel_time_minutes": (
                    round(
                        travel_time_minutes,
                        2
                    )
                    if travel_time_minutes
                    is not None
                    else None
                ),

                "average_speed_kmh": (
                    round(
                        average_speed_kmh,
                        2
                    )
                    if average_speed_kmh
                    is not None
                    else None
                ),
            }
        )


    # ========================================================
    # RETURN
    # ========================================================

    return {

        # ----------------------------------------------------
        # Existing whole-corridor values
        # ----------------------------------------------------

        "distance_km": (

            distance_meters / 1000

            if distance_meters
            is not None

            else None
        ),

        "traffic_duration_seconds": (

            _duration_to_seconds(
                duration
            )

            if duration
            else None
        ),

        "static_duration_seconds": (

            _duration_to_seconds(
                static_duration
            )

            if static_duration
            else None
        ),

        # ----------------------------------------------------
        # New segment-level information
        # ----------------------------------------------------

        "segments": segments,
    }


# ============================================================
# DURATION HELPER
# ============================================================

def _duration_to_seconds(
    duration: str,
) -> float:
    """
    Google returns durations such as:

        '1620s'

    or values containing fractional seconds.
    """

    return float(
        duration.rstrip("s")
    )