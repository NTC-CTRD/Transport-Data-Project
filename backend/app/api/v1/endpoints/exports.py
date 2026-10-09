from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.excel_export_service import (
    generate_traffic_excel,
)


router = APIRouter(
    prefix="/exports",
    tags=["Data Exports"],
)


@router.get("/traffic-excel")
def export_traffic_excel(
    corridor_id: int | None = Query(
        default=None
    ),
    start_date: datetime | None = Query(
        default=None
    ),
    end_date: datetime | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Export traffic history and segment history
    as an Excel workbook.
    """

    excel_file = generate_traffic_excel(
        db=db,
        corridor_id=corridor_id,
        start_date=start_date,
        end_date=end_date,
    )

    filename = (
        "mtrada_traffic_history.xlsx"
    )

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )