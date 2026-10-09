from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GOOGLE_MAPS_API_KEY: str

    COLLECTION_INTERVAL_MINUTES: int = 15

    class Config:
        env_file = ".env"


settings = Settings()