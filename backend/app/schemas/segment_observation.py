from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SegmentTrafficObservationResponse(BaseModel):
    id: int
    corridor_id: int

    from_stop_id: int
    to_stop_id: int

    sequence_order: int

    observed_at: datetime

    distance_km: float
    travel_time_minutes: float
    average_speed_kmh: float

    traffic_condition: str

    traffic_duration_seconds: float
    static_duration_seconds: float

    data_source: str
    created_at: datetime

    from_stop_name: str
    to_stop_name: str

    model_config = ConfigDict(
        from_attributes=True
    )