from pydantic import BaseModel, Field


class RouteCreate(BaseModel):
    corridor_id: int
    route_number: str = Field(min_length=1, max_length=20)
    route_name: str = Field(min_length=3, max_length=150)
    direction: str = Field(min_length=2, max_length=30)
    operator: str = Field(min_length=2, max_length=100)


class RouteUpdate(BaseModel):
    route_number: str = Field(min_length=1, max_length=20)
    route_name: str = Field(min_length=3, max_length=150)
    direction: str = Field(min_length=2, max_length=30)
    operator: str = Field(min_length=2, max_length=100)
    status: str


class RouteResponse(BaseModel):
    id: int
    corridor_id: int
    route_number: str
    route_name: str
    direction: str
    operator: str
    status: str

    model_config = {
        "from_attributes": True
    }