from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.segment_observation import (
    SegmentTrafficObservationResponse,
)
from app.services.segment_observation_service import (
    SegmentObservationService,
)


router = APIRouter(
    prefix="/segment-observations",
    tags=["Segment Traffic Observations"],
)


service = SegmentObservationService()


@router.get(
    "/corridor/{corridor_id}",
    response_model=list[
        SegmentTrafficObservationResponse
    ],
)
def get_corridor_segments(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return service.get_by_corridor(
        db,
        corridor_id,
    )


@router.get(
    "/corridor/{corridor_id}/latest",
    response_model=list[
        SegmentTrafficObservationResponse
    ],
)
def get_latest_corridor_segments(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    return service.get_latest_by_corridor(
        db,
        corridor_id,
    )