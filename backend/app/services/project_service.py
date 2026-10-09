from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate

from fastapi import HTTPException


class ProjectService:

    def __init__(self):
        self.repository = ProjectRepository()

    def create(
        self,
        db: Session,
        data: ProjectCreate,
        user_id: int
    ):
        project = Project(
            name=data.name,
            description=data.description,
            district=data.district,
            created_by=user_id
        )

        return self.repository.create(db, project)

    def get_all(self, db: Session):
        return self.repository.get_all(db)

    def get_by_id(self, db: Session, project_id: int):

        project = self.repository.get_by_id(db, project_id)

        if project is None:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        return project