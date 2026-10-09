import asyncio

from app.db.database import SessionLocal
from app.models.corridor import Corridor
from app.services.google_traffic_service import (
    get_traffic_route,
)


async def main():

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Test Corridor 21
        # ----------------------------------------------------

        corridor_id = 21

        corridor = (
            db.query(Corridor)
            .filter(
                Corridor.id == corridor_id
            )
            .first()
        )

        if not corridor:

            raise ValueError(
                f"Corridor {corridor_id} not found."
            )


        # ----------------------------------------------------
        # Get ordered stops
        # ----------------------------------------------------

        stops = sorted(
            corridor.stops,
            key=lambda stop: stop.sequence_order
        )


        print("\nCorridor")
        print("========")

        print(
            "ID:",
            corridor.id
        )

        print(
            "Name:",
            corridor.name
        )

        print(
            "Number of stops:",
            len(stops)
        )


        # ----------------------------------------------------
        # Print stops
        # ----------------------------------------------------

        print("\nStops")
        print("=====")

        for stop in stops:

            print(
                f"{stop.sequence_order}. "
                f"{stop.name} "
                f"({stop.latitude}, {stop.longitude})"
            )


        # ----------------------------------------------------
        # Prepare Google route stops
        # ----------------------------------------------------

        route_stops = [
            {
                "name": stop.name,
                "latitude": stop.latitude,
                "longitude": stop.longitude,
                "sequence_order": stop.sequence_order,
            }
            for stop in stops
        ]


        # ----------------------------------------------------
        # Call Google Routes API
        # ----------------------------------------------------

        result = await get_traffic_route(
            route_stops
        )


        # ----------------------------------------------------
        # Whole corridor result
        # ----------------------------------------------------

        print("\nWhole Corridor")
        print("==============")

        print(
            "Distance:",
            result["distance_km"],
            "km"
        )

        print(
            "Traffic duration:",
            result["traffic_duration_seconds"],
            "seconds"
        )

        print(
            "Static duration:",
            result["static_duration_seconds"],
            "seconds"
        )


        # ----------------------------------------------------
        # Segment result
        # ----------------------------------------------------

        segments = result.get(
            "segments",
            []
        )


        print("\nSegments")
        print("========")

        print(
            "Number of segments:",
            len(segments)
        )


        for segment in segments:

            print(
                f"\nSegment "
                f"{segment['sequence_order']}"
            )

            print(
                "From:",
                segment["from_stop"]["name"]
            )

            print(
                "To:",
                segment["to_stop"]["name"]
            )

            print(
                "Distance:",
                segment["distance_km"],
                "km"
            )

            print(
                "Travel time:",
                segment["travel_time_minutes"],
                "minutes"
            )

            print(
                "Average speed:",
                segment["average_speed_kmh"],
                "km/h"
            )

            print(
                "Traffic duration:",
                segment[
                    "traffic_duration_seconds"
                ],
                "seconds"
            )

            print(
                "Static duration:",
                segment[
                    "static_duration_seconds"
                ],
                "seconds"
            )


    finally:

        db.close()


asyncio.run(main())