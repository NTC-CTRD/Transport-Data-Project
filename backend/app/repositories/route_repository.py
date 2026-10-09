from sqlalchemy.orm import Session

from app.models.route import Route


class RouteRepository:

    def create(self, db: Session, route: Route):
        db.add(route)
        db.commit()
        db.refresh(route)
        return route

    def get_all(self, db: Session):
        return db.query(Route).all()

    def get_by_corridor(self, db: Session, corridor_id: int):
        return (
            db.query(Route)
            .filter(Route.corridor_id == corridor_id)
            .all()
        )

    def get_by_id(self, db: Session, route_id: int):
        return (
            db.query(Route)
            .filter(Route.id == route_id)
            .first()
        )

    def update(self, db: Session, route: Route):
        db.commit()
        db.refresh(route)
        return route

    def delete(self, db: Session, route: Route):
        db.delete(route)
        db.commit()