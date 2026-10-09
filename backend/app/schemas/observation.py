from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrafficObservationCreate(BaseModel):
    corridor_id: int
    observed_at: datetime
    travel_time_minutes: float
    distance_km: float
    average_speed_kmh: float
    traffic_condition: str
    data_source: str = "Google Maps"


class TrafficObservationResponse(BaseModel):
    id: int
    corridor_id: int
    observed_at: datetime
    travel_time_minutes: float
    distance_km: float
    average_speed_kmh: float
    traffic_condition: str
    data_source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)