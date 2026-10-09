from sqlalchemy.orm import Session

from app.models.observation import TrafficObservation
from app.repositories.observation_repository import (
    ObservationRepository,
)
from app.schemas.observation import (
    TrafficObservationCreate,
)


class ObservationService:

    def __init__(self):
        self.repository = ObservationRepository()

    def create(
        self,
        db: Session,
        observation_data: TrafficObservationCreate,
    ):
        observation = TrafficObservation(
            corridor_id=observation_data.corridor_id,
            observed_at=observation_data.observed_at,
            travel_time_minutes=(
                observation_data.travel_time_minutes
            ),
            distance_km=(
                observation_data.distance_km
            ),
            average_speed_kmh=(
                observation_data.average_speed_kmh
            ),
            traffic_condition=(
                observation_data.traffic_condition
            ),
            data_source=(
                observation_data.data_source
            ),
        )

        return self.repository.create(
            db,
            observation,
        )

    def get_all(
        self,
        db: Session,
    ):
        return self.repository.get_all(db)

    def get_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        return self.repository.get_by_corridor(
            db,
            corridor_id,
        )