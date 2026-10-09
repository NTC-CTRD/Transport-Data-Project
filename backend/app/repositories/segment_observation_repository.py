from sqlalchemy.orm import Session

from app.models.segment_observation import (
    SegmentTrafficObservation,
)


class SegmentObservationRepository:

    def get_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        return (
            db.query(
                SegmentTrafficObservation
            )
            .filter(
                SegmentTrafficObservation.corridor_id
                == corridor_id
            )
            .order_by(
                SegmentTrafficObservation.observed_at.desc(),
                SegmentTrafficObservation.sequence_order.asc(),
            )
            .all()
        )

    def get_latest_by_corridor(
        self,
        db: Session,
        corridor_id: int,
    ):
        latest_time = (
            db.query(
                SegmentTrafficObservation.observed_at
            )
            .filter(
                SegmentTrafficObservation.corridor_id
                == corridor_id
            )
            .order_by(
                SegmentTrafficObservation.observed_at.desc()
            )
            .first()
        )

        if not latest_time:
            return []

        return (
            db.query(
                SegmentTrafficObservation
            )
            .filter(
                SegmentTrafficObservation.corridor_id
                == corridor_id,
                SegmentTrafficObservation.observed_at
                == latest_time[0],
            )
            .order_by(
                SegmentTrafficObservation.sequence_order.asc()
            )
            .all()
        )