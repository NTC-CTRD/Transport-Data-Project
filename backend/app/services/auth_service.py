from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate



class AuthService:

    def __init__(self):
        self.user_repository = UserRepository()

    def register(self, db: Session, user_data: UserCreate):

        existing = self.user_repository.get_by_email(
            db,
            user_data.email
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            role="planner"
        )

        return self.user_repository.create(db, user)

    def login(self, db: Session, email: str, password: str):
        user = self.user_repository.get_by_email(db, email)

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        token = create_access_token(
            {
                "sub": user.email,
                "role": user.role
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }

