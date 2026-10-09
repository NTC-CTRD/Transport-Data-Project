from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_route_service,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.route import (
    RouteCreate,
    RouteResponse,
    RouteUpdate,
)
from app.services.route_service import RouteService

router = APIRouter(
    prefix="/routes",
    tags=["Routes"]
)


@router.post(
    "",
    response_model=RouteResponse,
    status_code=201
)
def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
):
    return service.create(db, route)


@router.get(
    "",
    response_model=list[RouteResponse]
)
def get_routes(
    corridor_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
):
    if corridor_id:
        return service.get_by_corridor(db, corridor_id)

    return service.get_all(db)


@router.get(
    "/{route_id}",
    response_model=RouteResponse
)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
):
    return service.get_by_id(db, route_id)


@router.put(
    "/{route_id}",
    response_model=RouteResponse
)
def update_route(
    route_id: int,
    route: RouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
):
    return service.update(
        db,
        route_id,
        route
    )


@router.delete("/{route_id}")
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: RouteService = Depends(get_route_service),
):
    return service.delete(
        db,
        route_id
    )