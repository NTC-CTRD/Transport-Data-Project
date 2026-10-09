import asyncio

from app.db.database import SessionLocal
from app.services.traffic_collector import (
    collect_all_active_corridors,
)


async def main():
    db = SessionLocal()

    try:
        results = (
            await collect_all_active_corridors(
                db
            )
        )

        print(
            "\nAutomatic Traffic Collection"
        )
        print(
            "============================="
        )

        for result in results:
            print(result)

    finally:
        db.close()


asyncio.run(main())