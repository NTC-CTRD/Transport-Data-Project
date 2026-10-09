from typing import Optional

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    description: Optional[str] = None
    district: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    district: Optional[str]
    status: str

    model_config = {
        "from_attributes": True
    }