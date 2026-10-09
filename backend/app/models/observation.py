from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class TrafficObservation(Base):
    __tablename__ = "traffic_observations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    corridor_id: Mapped[int] = mapped_column(
        ForeignKey("corridors.id"),
        nullable=False
    )

    observed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    travel_time_minutes: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    distance_km: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    average_speed_kmh: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    traffic_condition: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    data_source: Mapped[str] = mapped_column(
        String(50),
        default="Google Maps"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    corridor = relationship(
        "Corridor",
        back_populates="observations"
    )