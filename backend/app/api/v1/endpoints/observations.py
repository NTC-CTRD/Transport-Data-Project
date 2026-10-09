from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
)

from app.db.database import get_db

from app.models.user import User
from app.models.corridor import Corridor
from app.models.observation import TrafficObservation

from app.schemas.observation import (
    TrafficObservationCreate,
    TrafficObservationResponse,
)

from app.services.observation_service import (
    ObservationService,
)

from app.services.traffic_collector import (
    collect_all_active_corridors,
)


router = APIRouter(
    prefix="/observations",
    tags=["Traffic Observations"],
)


service = ObservationService()


# ============================================================
# CREATE OBSERVATION
# ============================================================

@router.post(
    "",
    response_model=TrafficObservationResponse,
    status_code=201,
)
def create_observation(
    observation: TrafficObservationCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.create(
        db,
        observation,
    )


# ============================================================
# COLLECT TRAFFIC FOR ALL ACTIVE CORRIDORS
# ============================================================

@router.post(
    "/collect",
)
async def collect_active_corridors(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    return await collect_all_active_corridors(
        db
    )


# ============================================================
# GET ALL OBSERVATIONS
# ============================================================

@router.get(
    "",
    response_model=list[
        TrafficObservationResponse
    ],
)
def get_observations(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    return service.get_all(db)


# ============================================================
# GET OBSERVATIONS FOR ONE CORRIDOR
# ============================================================

@router.get(
    "/corridor/{corridor_id}",
    response_model=list[
        TrafficObservationResponse
    ],
)
def get_corridor_observations(
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


# ============================================================
# GET LATEST OBSERVATION FOR EVERY ACTIVE CORRIDOR
# ============================================================

@router.get(
    "/latest/active",
)
def get_latest_active_corridors(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    corridors = (
        db.query(Corridor)
        .filter(
            Corridor.status == "Active"
        )
        .all()
    )

    results = []

    for corridor in corridors:

        latest_observation = (
            db.query(TrafficObservation)
            .filter(
                TrafficObservation.corridor_id
                == corridor.id
            )
            .order_by(
                TrafficObservation.observed_at.desc()
            )
            .first()
        )

        # ----------------------------------------------------
        # Skip corridors that have no observations yet
        # ----------------------------------------------------

        if not latest_observation:
            continue

        # ----------------------------------------------------
        # Get ordered corridor stops
        # ----------------------------------------------------

        stops = sorted(
            corridor.stops,
            key=lambda stop: stop.sequence_order
        )

        results.append(
            {
                "corridor_id": corridor.id,

                "corridor_name": corridor.name,

                "origin": corridor.origin,

                "origin_latitude": (
                    corridor.origin_latitude
                ),

                "origin_longitude": (
                    corridor.origin_longitude
                ),

                "destination": (
                    corridor.destination
                ),

                "destination_latitude": (
                    corridor.destination_latitude
                ),

                "destination_longitude": (
                    corridor.destination_longitude
                ),

                # ------------------------------------------------
                # FULL CORRIDOR STOP LIST
                # ------------------------------------------------

                "stops": [
                    {
                        "id": stop.id,
                        "name": stop.name,
                        "latitude": stop.latitude,
                        "longitude": stop.longitude,
                        "sequence_order": stop.sequence_order,
                    }
                    for stop in stops
                ],

                "distance_km": (
                    latest_observation.distance_km
                ),

                "travel_time_minutes": (
                    latest_observation.travel_time_minutes
                ),

                "average_speed_kmh": (
                    latest_observation.average_speed_kmh
                ),

                "traffic_condition": (
                    latest_observation.traffic_condition
                ),

                "observed_at": (
                    latest_observation.observed_at
                ),

                "data_source": (
                    latest_observation.data_source
                ),
            }
        )

    return results