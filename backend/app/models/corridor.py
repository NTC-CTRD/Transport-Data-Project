from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Corridor(Base):
    __tablename__ = "corridors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    origin: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    origin_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    origin_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    destination: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    destination_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    destination_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    distance_km: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    project = relationship(
        "Project",
        back_populates="corridors"
    )

    routes = relationship(
        "Route",
        back_populates="corridor",
        cascade="all, delete-orphan"
    )

    stops = relationship(
        "CorridorStop",
        back_populates="corridor",
        cascade="all, delete-orphan",
        order_by="CorridorStop.sequence_order"
    )

    observations = relationship(
        "TrafficObservation",
        back_populates="corridor",
        cascade="all, delete-orphan"
    )

    segment_observations = relationship(
        "SegmentTrafficObservation",
        back_populates="corridor",
        cascade="all, delete-orphan"
    )