from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.corridor import Corridor
from app.models.observation import TrafficObservation
from app.models.segment_observation import (
    SegmentTrafficObservation,
)
from app.services.google_traffic_service import (
    get_traffic_route,
)


async def collect_corridor_observation(
    db: Session,
    corridor_id: int,
):
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

    # Get corridor stops in the correct order.
    stops = sorted(
        corridor.stops,
        key=lambda stop: stop.sequence_order,
    )

    if len(stops) < 2:
        raise ValueError(
            "Corridor must contain at least 2 stops."
        )

    if len(stops) > 10:
        raise ValueError(
            "Corridor cannot contain more than 10 stops."
        )

    route_stops = [
        {
            "name": stop.name,
            "latitude": stop.latitude,
            "longitude": stop.longitude,
            "sequence_order": stop.sequence_order,
        }
        for stop in stops
    ]

    # Get whole-corridor and segment traffic
    # information from Google Routes API.
    result = await get_traffic_route(
        route_stops
    )

    traffic_duration_seconds = (
        result["traffic_duration_seconds"]
    )

    static_duration_seconds = (
        result["static_duration_seconds"]
    )

    distance_km = result["distance_km"]

    if traffic_duration_seconds is None:
        raise ValueError(
            "Google did not return traffic duration."
        )

    if distance_km is None:
        raise ValueError(
            "Google did not return route distance."
        )

    travel_time_minutes = (
        traffic_duration_seconds / 60
    )

    average_speed_kmh = (
        distance_km
        / (travel_time_minutes / 60)
        if travel_time_minutes > 0
        else 0
    )

    traffic_condition = (
        determine_traffic_condition(
            static_duration_seconds,
            traffic_duration_seconds,
        )
    )

    observed_at = datetime.now(
        timezone.utc
    )

    # -------------------------------------------------
    # 1. Save whole-corridor observation
    # -------------------------------------------------

    observation = TrafficObservation(
        corridor_id=corridor.id,
        observed_at=observed_at,
        travel_time_minutes=travel_time_minutes,
        distance_km=distance_km,
        average_speed_kmh=average_speed_kmh,
        traffic_condition=traffic_condition,
        data_source="Google Maps",
    )

    db.add(observation)

    # -------------------------------------------------
    # 2. Save segment observations
    # -------------------------------------------------

    segment_observations = []

    for segment in result["segments"]:

        from_sequence = (
            segment["from_stop"][
                "sequence_order"
            ]
        )

        to_sequence = (
            segment["to_stop"][
                "sequence_order"
            ]
        )

        # Find the actual CorridorStop records.
        from_stop = next(
            (
                stop
                for stop in stops
                if stop.sequence_order
                == from_sequence
            ),
            None,
        )

        to_stop = next(
            (
                stop
                for stop in stops
                if stop.sequence_order
                == to_sequence
            ),
            None,
        )

        if not from_stop or not to_stop:
            raise ValueError(
                "Could not match Google route "
                "segment to corridor stops."
            )

        segment_traffic_duration = (
            segment[
                "traffic_duration_seconds"
            ]
        )

        segment_static_duration = (
            segment[
                "static_duration_seconds"
            ]
        )

        segment_distance_km = (
            segment["distance_km"]
        )

        segment_travel_time_minutes = (
            segment["travel_time_minutes"]
        )

        segment_average_speed_kmh = (
            segment["average_speed_kmh"]
        )

        if (
            segment_traffic_duration
            is None
        ):
            raise ValueError(
                "Google did not return traffic "
                "duration for a segment."
            )

        if (
            segment_static_duration
            is None
        ):
            raise ValueError(
                "Google did not return static "
                "duration for a segment."
            )

        if segment_distance_km is None:
            raise ValueError(
                "Google did not return distance "
                "for a segment."
            )

        if (
            segment_travel_time_minutes
            is None
        ):
            raise ValueError(
                "Google did not return travel "
                "time for a segment."
            )

        if (
            segment_average_speed_kmh
            is None
        ):
            segment_average_speed_kmh = 0

        segment_condition = (
            determine_traffic_condition(
                segment_static_duration,
                segment_traffic_duration,
            )
        )

        segment_observation = (
            SegmentTrafficObservation(
                corridor_id=corridor.id,

                from_stop_id=from_stop.id,

                to_stop_id=to_stop.id,

                sequence_order=segment[
                    "sequence_order"
                ],

                observed_at=observed_at,

                distance_km=segment_distance_km,

                travel_time_minutes=(
                    segment_travel_time_minutes
                ),

                average_speed_kmh=(
                    segment_average_speed_kmh
                ),

                traffic_condition=(
                    segment_condition
                ),

                traffic_duration_seconds=(
                    segment_traffic_duration
                ),

                static_duration_seconds=(
                    segment_static_duration
                ),

                data_source="Google Maps",
            )
        )

        db.add(
            segment_observation
        )

        segment_observations.append(
            segment_observation
        )

    # -------------------------------------------------
    # 3. Commit everything together
    # -------------------------------------------------

    db.commit()

    db.refresh(
        observation
    )

    for segment_observation in (
        segment_observations
    ):
        db.refresh(
            segment_observation
        )

    return observation


async def collect_all_active_corridors(db, corridor_id=None):

    query = (
        db.query(Corridor)
        .filter(Corridor.status == "Active")
    )

    if corridor_id is not None:
        query = query.filter(Corridor.id == corridor_id)

    corridors = query.all()

    results = []

    for corridor in corridors:
        try:
            observation = (
                await collect_corridor_observation(
                    db,
                    corridor.id,
                )
            )

            results.append(
                {
                    "corridor_id": corridor.id,
                    "status": "success",
                    "observation_id": (
                        observation.id
                    ),
                }
            )

        except Exception as error:
            db.rollback()

            results.append(
                {
                    "corridor_id": corridor.id,
                    "status": "failed",
                    "error": str(error),
                }
            )

    return results


def determine_traffic_condition(
    static_duration_seconds,
    traffic_duration_seconds,
):
    if not static_duration_seconds:
        return "Unknown"

    delay_ratio = (
        traffic_duration_seconds
        / static_duration_seconds
    )

    if delay_ratio <= 1.10:
        return "Free Flow"

    if delay_ratio <= 1.25:
        return "Light"

    if delay_ratio <= 1.50:
        return "Moderate"

    if delay_ratio <= 1.75:
        return "Heavy"

    return "Severe"