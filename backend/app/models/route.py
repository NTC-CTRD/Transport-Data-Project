from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    corridor_id: Mapped[int] = mapped_column(
        ForeignKey("corridors.id"),
        nullable=False
    )

    route_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    route_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    direction: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    operator: Mapped[str] = mapped_column(
        String(100),
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

    corridor = relationship(
        "Corridor",
        back_populates="routes"
    )