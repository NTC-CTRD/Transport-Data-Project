from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.corridor import Corridor
from app.models.corridor_stop import CorridorStop
from app.repositories.corridor_repository import CorridorRepository
from app.schemas.corridor import (
    CorridorCreate,
    CorridorUpdate,
)


class CorridorService:

    def __init__(self):
        self.repository = CorridorRepository()

    # ========================================================
    # CREATE CORRIDOR
    # ========================================================

    def create(
        self,
        db: Session,
        data: CorridorCreate
    ):

        # ----------------------------------------------------
        # Validate stop sequence
        # ----------------------------------------------------

        sequences = [
            stop.sequence_order
            for stop in data.stops
        ]

        expected_sequences = list(
            range(1, len(data.stops) + 1)
        )

        if sorted(sequences) != expected_sequences:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Corridor stops must have "
                    "continuous sequence numbers "
                    "starting from 1."
                )
            )

        # ----------------------------------------------------
        # Create corridor
        # ----------------------------------------------------

        corridor = Corridor(
            project_id=data.project_id,
            name=data.name,

            origin=data.origin,
            origin_latitude=data.origin_latitude,
            origin_longitude=data.origin_longitude,

            destination=data.destination,
            destination_latitude=data.destination_latitude,
            destination_longitude=data.destination_longitude,

            distance_km=data.distance_km,
        )

        # ----------------------------------------------------
        # Add corridor stops
        # ----------------------------------------------------

        for stop in sorted(
            data.stops,
            key=lambda item: item.sequence_order
        ):

            corridor.stops.append(
                CorridorStop(
                    name=stop.name,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                    sequence_order=stop.sequence_order,
                )
            )

        return self.repository.create(
            db,
            corridor
        )

    # ========================================================
    # GET ALL
    # ========================================================

    def get_all(
        self,
        db: Session
    ):

        return self.repository.get_all(db)

    # ========================================================
    # GET BY PROJECT
    # ========================================================

    def get_by_project(
        self,
        db: Session,
        project_id: int
    ):

        return self.repository.get_by_project(
            db,
            project_id
        )

    # ========================================================
    # GET BY ID
    # ========================================================

    def get_by_id(
        self,
        db: Session,
        corridor_id: int
    ):

        corridor = self.repository.get_by_id(
            db,
            corridor_id
        )

        if corridor is None:

            raise HTTPException(
                status_code=404,
                detail="Corridor not found"
            )

        return corridor

    # ========================================================
    # UPDATE CORRIDOR
    # ========================================================

    def update(
        self,
        db: Session,
        corridor_id: int,
        data: CorridorUpdate,
    ):

        corridor = self.get_by_id(
            db,
            corridor_id
        )

        # ----------------------------------------------------
        # Validate stop sequence
        # ----------------------------------------------------

        sequences = [
            stop.sequence_order
            for stop in data.stops
        ]

        expected_sequences = list(
            range(1, len(data.stops) + 1)
        )

        if sorted(sequences) != expected_sequences:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Corridor stops must have "
                    "continuous sequence numbers "
                    "starting from 1."
                )
            )

        # ----------------------------------------------------
        # Update corridor information
        # ----------------------------------------------------

        corridor.name = data.name

        corridor.origin = data.origin
        corridor.origin_latitude = (
            data.origin_latitude
        )
        corridor.origin_longitude = (
            data.origin_longitude
        )

        corridor.destination = data.destination
        corridor.destination_latitude = (
            data.destination_latitude
        )
        corridor.destination_longitude = (
            data.destination_longitude
        )

        corridor.distance_km = (
            data.distance_km
        )

        corridor.status = data.status

        # ----------------------------------------------------
        # Replace existing stops
        # ----------------------------------------------------

        corridor.stops.clear()

        for stop in sorted(
            data.stops,
            key=lambda item: item.sequence_order
        ):

            corridor.stops.append(
                CorridorStop(
                    name=stop.name,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                    sequence_order=stop.sequence_order,
                )
            )

        return self.repository.update(
            db,
            corridor
        )

    # ========================================================
    # DELETE CORRIDOR
    # ========================================================

    def delete(
        self,
        db: Session,
        corridor_id: int
    ):

        corridor = self.get_by_id(
            db,
            corridor_id
        )

        self.repository.delete(
            db,
            corridor
        )

        return {
            "message": "Corridor deleted successfully"
        }