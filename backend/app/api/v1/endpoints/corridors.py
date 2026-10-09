from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from app.services.traffic_collector import collect_all_active_corridors

from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_corridor_service,
)

from app.db.database import get_db

from app.models.user import User
from app.models.corridor import Corridor
from app.models.corridor_stop import CorridorStop

from app.schemas.corridor import (
    CorridorCreate,
    CorridorResponse,
    CorridorUpdate,
)

from app.services.corridor_service import CorridorService


router = APIRouter(
    prefix="/corridors",
    tags=["Corridors"]
)

service = CorridorService()

# ============================================================
# CREATE CORRIDOR
# ============================================================

@router.post("", response_model=CorridorResponse, status_code=201)
async def create_corridor(
    corridor: CorridorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_corridor = service.create(db, corridor)

    await collect_all_active_corridors(
        db,
        corridor_id=new_corridor.id,
    )

    return new_corridor


# ============================================================
# GET ALL CORRIDORS
# ============================================================

@router.get(
    "",
    response_model=list[CorridorResponse]
)
def get_corridors(
    project_id: int | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
    service: CorridorService = Depends(
        get_corridor_service
    ),
):

    if project_id:
        return service.get_by_project(
            db,
            project_id
        )

    return service.get_all(db)

# ============================================================
# GET CORRIDOR STOPS
# ============================================================

@router.get(
    "/{corridor_id}/stops"
)
def get_corridor_stops(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    corridor = (
        db.query(Corridor)
        .filter(
            Corridor.id == corridor_id
        )
        .first()
    )

    if corridor is None:

        raise HTTPException(
            status_code=404,
            detail="Corridor not found"
        )

    return (
        db.query(CorridorStop)
        .filter(
            CorridorStop.corridor_id
            == corridor_id
        )
        .order_by(
            CorridorStop.sequence_order
        )
        .all()
    )


# ============================================================
# GET SINGLE CORRIDOR
# ============================================================

@router.get(
    "/{corridor_id}",
    response_model=CorridorResponse
)
def get_corridor(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
    service: CorridorService = Depends(
        get_corridor_service
    ),
):

    return service.get_by_id(
        db,
        corridor_id
    )




# ============================================================
# UPDATE CORRIDOR
# ============================================================

@router.put(
    "/{corridor_id}",
    response_model=CorridorResponse
)
def update_corridor(
    corridor_id: int,
    corridor: CorridorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
    service: CorridorService = Depends(
        get_corridor_service
    ),
):

    return service.update(
        db,
        corridor_id,
        corridor
    )


# ============================================================
# DELETE CORRIDOR
# ============================================================

@router.delete(
    "/{corridor_id}"
)
def delete_corridor(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
    service: CorridorService = Depends(
        get_corridor_service
    ),
):

    return service.delete(
        db,
        corridor_id
    )