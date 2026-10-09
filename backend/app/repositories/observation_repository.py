from sqlalchemy.orm import Session

from app.models.observation import TrafficObservation


class ObservationRepository:

    def create(
        self,
        db: Session,
        observation: TrafficObservation,
    ):
        db.add(observation)
        db.commit()
        db.refresh(observation)

        return observation

    def get_all(
        self,
        db: Session,
    ):
        return (
            db.query(TrafficObservation)
            .order_by(
                TrafficObservation.observed_at.desc()
            )
            .all()
        )

    def get_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        return (
            db.query(TrafficObservation)
            .filter(
                TrafficObservation.corridor_id
                == corridor_id
            )
            .order_by(
                TrafficObservation.observed_at.desc()
            )
            .all()
        )