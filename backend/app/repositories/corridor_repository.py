from sqlalchemy.orm import Session

from app.models.corridor import Corridor


class CorridorRepository:

    def create(self, db: Session, corridor: Corridor):
        db.add(corridor)
        db.commit()
        db.refresh(corridor)
        return corridor

    def get_all(self, db: Session):
        return db.query(Corridor).all()

    def get_by_project(self, db: Session, project_id: int):
        return (
            db.query(Corridor)
            .filter(Corridor.project_id == project_id)
            .all()
        )

    def get_by_id(self, db: Session, corridor_id: int):
        return (
            db.query(Corridor)
            .filter(Corridor.id == corridor_id)
            .first()
        )

    def update(self, db: Session, corridor: Corridor):
        db.commit()
        db.refresh(corridor)
        return corridor

    def delete(self, db: Session, corridor: Corridor):
        db.delete(corridor)
        db.commit()