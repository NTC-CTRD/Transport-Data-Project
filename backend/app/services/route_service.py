from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.route import Route
from app.repositories.route_repository import RouteRepository
from app.schemas.route import RouteCreate, RouteUpdate


class RouteService:

    def __init__(self):
        self.repository = RouteRepository()

    def create(self, db: Session, data: RouteCreate):

        route = Route(
            corridor_id=data.corridor_id,
            route_number=data.route_number,
            route_name=data.route_name,
            direction=data.direction,
            operator=data.operator,
        )

        return self.repository.create(db, route)

    def get_all(self, db: Session):
        return self.repository.get_all(db)

    def get_by_corridor(self, db: Session, corridor_id: int):
        return self.repository.get_by_corridor(db, corridor_id)

    def get_by_id(self, db: Session, route_id: int):

        route = self.repository.get_by_id(db, route_id)

        if route is None:
            raise HTTPException(
                status_code=404,
                detail="Route not found"
            )

        return route

    def update(
        self,
        db: Session,
        route_id: int,
        data: RouteUpdate,
    ):

        route = self.get_by_id(db, route_id)

        route.route_number = data.route_number
        route.route_name = data.route_name
        route.direction = data.direction
        route.operator = data.operator
        route.status = data.status

        return self.repository.update(db, route)

    def delete(self, db: Session, route_id: int):

        route = self.get_by_id(db, route_id)

        self.repository.delete(db, route)

        return {
            "message": "Route deleted successfully"
        }