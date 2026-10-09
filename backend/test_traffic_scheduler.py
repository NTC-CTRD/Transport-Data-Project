import asyncio
import unittest
from datetime import time

from app.services.traffic_scheduler import (
    is_traffic_collection_allowed,
    traffic_collection_loop,
)


class TrafficSchedulerOperatingHoursTests(unittest.TestCase):

    def test_is_traffic_collection_allowed(self):
        cases = [
            (time(4, 0), True),
            (time(9, 30), True),
            (time(22, 29, 59), True),
            (time(22, 30), False),
            (time(23, 0), False),
            (time(3, 59, 59), False),
        ]

        for current_time, expected in cases:
            with self.subTest(current_time=current_time):
                self.assertIs(
                    is_traffic_collection_allowed(current_time),
                    expected,
                )


async def main():

    print("===================================")
    print("M-TRADA Traffic Scheduler Test")
    print("===================================")

    print("Starting scheduler...")

    await traffic_collection_loop()


if __name__ == "__main__":
    asyncio.run(main())