import asyncio

from app.services.google_traffic_service import (
    get_traffic_route,
)


async def main():
    result = await get_traffic_route(
        origin_latitude=6.851301,
        origin_longitude=79.865981,
        destination_latitude=6.9003143,
        destination_longitude=79.8529847,
    )

    print("\nGoogle Traffic Result")
    print("=====================")

    print(
        "Distance:",
        result["distance_km"],
        "km",
    )

    print(
        "Traffic duration:",
        result["traffic_duration_seconds"],
        "seconds",
    )

    print(
        "Static duration:",
        result["static_duration_seconds"],
        "seconds",
    )


asyncio.run(main())