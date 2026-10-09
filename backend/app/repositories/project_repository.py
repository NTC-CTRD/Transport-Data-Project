from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:

    def create(self, db: Session, project: Project):
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def get_all(self, db: Session):
        return db.query(Project).all()

    def get_by_id(self, db: Session, project_id: int):
        return db.query(Project).filter(Project.id == project_id).first()