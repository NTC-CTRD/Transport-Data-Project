from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.corridor_stop import CorridorStop

from app.repositories.segment_observation_repository import (
    SegmentObservationRepository,
)


class SegmentObservationService:

    def __init__(self):
        self.repository = (
            SegmentObservationRepository()
        )

    def get_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        observations = (
            self.repository.get_by_corridor(
                db,
                corridor_id,
            )
        )

        return self._attach_stop_names(
            db,
            observations,
        )

    def get_latest_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        observations = (
            self.repository.get_latest_by_corridor(
                db,
                corridor_id,
            )
        )

        return self._attach_stop_names(
            db,
            observations,
        )

    def _attach_stop_names(
        self,
        db: Session,
        observations,
    ):
        results = []

        for observation in observations:

            from_stop = (
                db.query(CorridorStop)
                .filter(
                    CorridorStop.id
                    == observation.from_stop_id
                )
                .first()
            )

            to_stop = (
                db.query(CorridorStop)
                .filter(
                    CorridorStop.id
                    == observation.to_stop_id
                )
                .first()
            )

            if not from_stop or not to_stop:
                continue

            results.append(
                {
                    "id": observation.id,
                    "corridor_id": observation.corridor_id,

                    "from_stop_id": (
                        observation.from_stop_id
                    ),
                    "to_stop_id": (
                        observation.to_stop_id
                    ),

                    "sequence_order": (
                        observation.sequence_order
                    ),

                    "observed_at": (
                        observation.observed_at
                    ),

                    "distance_km": (
                        observation.distance_km
                    ),

                    "travel_time_minutes": (
                        observation.travel_time_minutes
                    ),

                    "average_speed_kmh": (
                        observation.average_speed_kmh
                    ),

                    "traffic_condition": (
                        observation.traffic_condition
                    ),

                    "traffic_duration_seconds": (
                        observation.traffic_duration_seconds
                    ),

                    "static_duration_seconds": (
                        observation.static_duration_seconds
                    ),

                    "data_source": (
                        observation.data_source
                    ),

                    "created_at": (
                        observation.created_at
                    ),

                    "from_stop_name": (
                        from_stop.name
                    ),

                    "to_stop_name": (
                        to_stop.name
                    ),
                }
            )

        return results