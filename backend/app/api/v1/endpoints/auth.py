from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

from app.schemas.user import UserLogin, Token

from app.core.dependencies import get_auth_service

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

service = AuthService()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return service.register(db, user)

    
@router.post(
    "/login",
    response_model=Token
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
    service: AuthService = Depends(get_auth_service),
):
    return service.login(
        db,
        credentials.email,
        credentials.password,
    )