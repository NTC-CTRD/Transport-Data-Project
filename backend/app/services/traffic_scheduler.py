import asyncio
import logging
from datetime import datetime, time
from zoneinfo import ZoneInfo

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)


from app.core.config import settings
from app.db.database import SessionLocal
from app.services.traffic_collector import (
    collect_all_active_corridors,
)


logger = logging.getLogger(
    "traffic_scheduler"
)


def is_traffic_collection_allowed(current_time):
    """
    Allow automated collection only between
    04:00 and 22:30 in Asia/Colombo timezone.
    """

    start_time = time(4, 0)
    end_time = time(22, 30)

    return start_time <= current_time < end_time


async def run_traffic_collection():
    """
    Run one traffic collection cycle
    for all active corridors.
    """

    current_time = (
        datetime.now(
            ZoneInfo("Asia/Colombo")
        ).time()
    )

    if not is_traffic_collection_allowed(current_time):
        logger.info(
            "M-TRADA traffic collection skipped: outside operating hours (04:00-22:30 Asia/Colombo)."
        )
        return []

    logger.info(
        "M-TRADA traffic collection allowed: operating hours (04:00-22:30 Asia/Colombo)."
    )

    db = SessionLocal()

    try:

        logger.info(
            "Starting traffic collection..."
        )

        results = (
            await collect_all_active_corridors(
                db
            )
        )

        successful = sum(
            1
            for result in results
            if result["status"] == "success"
        )

        failed = sum(
            1
            for result in results
            if result["status"] == "failed"
        )

        logger.info(
            "Traffic collection completed. "
            "Successful: %s | Failed: %s",
            successful,
            failed,
        )

        for result in results:

            if result["status"] == "success":

                logger.info(
                    "Corridor %s: observation %s created.",
                    result["corridor_id"],
                    result["observation_id"],
                )

            else:

                logger.warning(
                    "Corridor %s failed: %s",
                    result["corridor_id"],
                    result["error"],
                )

        return results

    except Exception:

        db.rollback()

        logger.exception(
            "Traffic collection error."
        )

        return []

    finally:

        db.close()


async def traffic_collection_loop():
    """
    Continuously collect traffic observations
    for all active corridors.
    """

    interval_minutes = (
        settings.COLLECTION_INTERVAL_MINUTES
    )

    interval_seconds = (
        interval_minutes * 60
    )

    logger.info(
        "========================================"
    )

    logger.info(
        "M-TRADA Traffic Collection Scheduler"
    )

    logger.info(
        "Collection interval: %s minutes",
        interval_minutes,
    )

    logger.info(
        "Operating hours: 04:00-22:30 Asia/Colombo",
    )

    logger.info(
        "========================================"
    )


    while True:

        try:

            await run_traffic_collection()

        except asyncio.CancelledError:

            logger.info(
                "Traffic collection scheduler stopped."
            )

            raise


        logger.info(
            "Next collection in %s minutes.",
            interval_minutes,
        )

        try:

            await asyncio.sleep(
                interval_seconds
            )

        except asyncio.CancelledError:

            logger.info(
                "Traffic collection scheduler stopped."
            )

            raise