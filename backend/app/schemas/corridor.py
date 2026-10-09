from pydantic import BaseModel, Field


# ============================================================
# CORRIDOR STOP
# ============================================================

class CorridorStopCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=150
    )

    latitude: float = Field(
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ge=-180,
        le=180
    )

    sequence_order: int = Field(
        ge=1
    )


class CorridorStopResponse(BaseModel):

    id: int

    name: str

    latitude: float

    longitude: float

    sequence_order: int

    model_config = {
        "from_attributes": True
    }


# ============================================================
# CORRIDOR CREATE
# ============================================================

class CorridorCreate(BaseModel):

    project_id: int

    name: str = Field(
        min_length=3,
        max_length=150
    )

    origin: str = Field(
        min_length=2,
        max_length=100
    )

    origin_latitude: float = Field(
        ge=-90,
        le=90
    )

    origin_longitude: float = Field(
        ge=-180,
        le=180
    )

    destination: str = Field(
        min_length=2,
        max_length=100
    )

    destination_latitude: float = Field(
        ge=-90,
        le=90
    )

    destination_longitude: float = Field(
        ge=-180,
        le=180
    )

    distance_km: float = Field(
        gt=0
    )

    # --------------------------------------------------------
    # Corridor can contain 2 to 10 stops
    #
    # 2 stops = Origin → Destination
    # 3 stops = Origin → Stop → Destination
    # 4 stops = Origin → Stop → Stop → Destination
    # 10 stops = Origin → Stop → Stop → Stop → Destination
    # --------------------------------------------------------

    stops: list[CorridorStopCreate] = Field(
        min_length=2,
        max_length=10
    )


# ============================================================
# CORRIDOR UPDATE
# ============================================================

class CorridorUpdate(BaseModel):

    name: str = Field(
        min_length=3,
        max_length=150
    )

    origin: str = Field(
        min_length=2,
        max_length=100
    )

    origin_latitude: float = Field(
        ge=-90,
        le=90
    )

    origin_longitude: float = Field(
        ge=-180,
        le=180
    )

    destination: str = Field(
        min_length=2,
        max_length=100
    )

    destination_latitude: float = Field(
        ge=-90,
        le=90
    )

    destination_longitude: float = Field(
        ge=-180,
        le=180
    )

    distance_km: float = Field(
        gt=0
    )

    status: str

    # --------------------------------------------------------
    # Corridor can contain 2 to 10 stops
    # --------------------------------------------------------

    stops: list[CorridorStopCreate] = Field(
        min_length=2,
        max_length=10
    )


# ============================================================
# CORRIDOR RESPONSE
# ============================================================

class CorridorResponse(BaseModel):

    id: int

    project_id: int

    name: str

    origin: str

    origin_latitude: float

    origin_longitude: float

    destination: str

    destination_latitude: float

    destination_longitude: float

    distance_km: float

    status: str

    # --------------------------------------------------------
    # Ordered corridor stops
    # --------------------------------------------------------

    stops: list[CorridorStopResponse] = Field(
        default_factory=list
)

    model_config = {
        "from_attributes": True
    }