from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class CorridorStop(Base):
    __tablename__ = "corridor_stops"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    corridor_id: Mapped[int] = mapped_column(
        ForeignKey("corridors.id", ondelete="CASCADE"),
        nullable=False
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    sequence_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    corridor = relationship(
        "Corridor",
        back_populates="stops"
    )