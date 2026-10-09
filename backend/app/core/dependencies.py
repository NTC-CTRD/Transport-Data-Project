from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import verify_access_token
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

from app.services.project_service import ProjectService

from app.services.corridor_service import CorridorService

from app.services.route_service import RouteService


security = HTTPBearer()


def get_auth_service():
    return AuthService()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    email = payload.get("sub")

    repository = UserRepository()

    user = repository.get_by_email(db, email)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

def get_project_service():
    return ProjectService()

def get_corridor_service():
    return CorridorService()

def get_route_service():
    return RouteService()