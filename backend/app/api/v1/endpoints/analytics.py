from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.observation import TrafficObservation
from app.models.corridor import Corridor
from app.models.segment_observation import SegmentTrafficObservation
from app.models.corridor_stop import CorridorStop


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)

def get_start_time(days: int):
    """
    Return the UTC start time for the selected
    analysis period.
    """

    return (
        datetime.now(timezone.utc)
        - timedelta(days=days)
    )

# ============================================================
# BASIC CORRIDOR ANALYTICS
# ============================================================

@router.get("/corridor/{corridor_id}")
def get_corridor_analytics(
    corridor_id: int,
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of previous days to analyze",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    start_time = get_start_time(days)

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id == corridor_id,
            TrafficObservation.observed_at >= start_time,
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:

        return {
            "corridor_id": corridor_id,
            "observation_count": 0,
            "message": "No observations available.",
        }

    travel_times = [
        observation.travel_time_minutes
        for observation in observations
    ]

    speeds = [
        observation.average_speed_kmh
        for observation in observations
    ]

    distances = [
        observation.distance_km
        for observation in observations
    ]

    average_travel_time = (
        sum(travel_times)
        / len(travel_times)
    )

    average_speed = (
        sum(speeds)
        / len(speeds)
    )

    average_distance = (
        sum(distances)
        / len(distances)
    )

    maximum_travel_time = max(
        travel_times
    )

    minimum_travel_time = min(
        travel_times
    )

    maximum_speed = max(
        speeds
    )

    minimum_speed = min(
        speeds
    )

    traffic_counts = {}

    for observation in observations:

        condition = (
            observation.traffic_condition
        )

        traffic_counts[condition] = (
            traffic_counts.get(
                condition,
                0,
            )
            + 1
        )

    most_common_condition = max(
        traffic_counts,
        key=traffic_counts.get,
    )

    return {

        "corridor_id": corridor_id,

        "observation_count": len(
            observations
        ),

        "average_distance_km": round(
            average_distance,
            3,
        ),

        "average_travel_time_minutes": round(
            average_travel_time,
            2,
        ),

        "minimum_travel_time_minutes": round(
            minimum_travel_time,
            2,
        ),

        "maximum_travel_time_minutes": round(
            maximum_travel_time,
            2,
        ),

        "average_speed_kmh": round(
            average_speed,
            2,
        ),

        "minimum_speed_kmh": round(
            minimum_speed,
            2,
        ),

        "maximum_speed_kmh": round(
            maximum_speed,
            2,
        ),

        "traffic_distribution": (
            traffic_counts
        ),

        "most_common_condition": (
            most_common_condition
        ),

    }


# ============================================================
# TIME-BASED / PEAK PERIOD ANALYSIS
# ============================================================

@router.get(
    "/corridor/{corridor_id}/time-analysis"
)
def get_corridor_time_analysis(
    corridor_id: int,
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of previous days to analyze",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    start_time = get_start_time(days)

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id== corridor_id,
            TrafficObservation.observed_at>= start_time,
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:

        return {

            "corridor_id": corridor_id,

            "observation_count": 0,

            "hourly_analysis": [],

            "peak_analysis": {

                "morning_peak": None,

                "evening_peak": None,

            },

        }

    hourly = {}

    for observation in observations:

        observed_time = (
            observation.observed_at
        )

        hour_key = (

            observed_time.year,

            observed_time.month,

            observed_time.day,

            observed_time.hour,

        )

        if hour_key not in hourly:

            hourly[hour_key] = {

                "travel_times": [],

                "speeds": [],

                "conditions": [],

            }

        hourly[hour_key][
            "travel_times"
        ].append(
            observation.travel_time_minutes
        )

        hourly[hour_key][
            "speeds"
        ].append(
            observation.average_speed_kmh
        )

        hourly[hour_key][
            "conditions"
        ].append(
            observation.traffic_condition
        )

    hourly_analysis = []

    for hour_key, values in sorted(
        hourly.items()
    ):

        (
            year,
            month,
            day,
            hour,
        ) = hour_key

        average_travel_time = (
            sum(
                values["travel_times"]
            )
            / len(
                values["travel_times"]
            )
        )

        average_speed = (
            sum(
                values["speeds"]
            )
            / len(
                values["speeds"]
            )
        )

        condition_counts = {}

        for condition in values[
            "conditions"
        ]:

            condition_counts[
                condition
            ] = (
                condition_counts.get(
                    condition,
                    0,
                )
                + 1
            )

        dominant_condition = max(
            condition_counts,
            key=condition_counts.get,
        )

        hourly_analysis.append({

            "date": (
                f"{year:04d}-"
                f"{month:02d}-"
                f"{day:02d}"
            ),

            "hour": hour,

            "observation_count": len(
                values["travel_times"]
            ),

            "average_travel_time_minutes": (
                round(
                    average_travel_time,
                    2,
                )
            ),

            "average_speed_kmh": (
                round(
                    average_speed,
                    2,
                )
            ),

            "dominant_condition": (
                dominant_condition
            ),

        })

    morning_peak = []

    evening_peak = []

    for item in hourly_analysis:

        hour = item["hour"]

        if 7 <= hour < 10:

            morning_peak.append(
                item
            )

        if 16 <= hour < 19:

            evening_peak.append(
                item
            )

    morning_summary = (
        calculate_peak_summary(
            morning_peak
        )
    )

    evening_summary = (
        calculate_peak_summary(
            evening_peak
        )
    )

    return {

        "corridor_id": corridor_id,

        "observation_count": len(
            observations
        ),

        "hourly_analysis": (
            hourly_analysis
        ),

        "peak_analysis": {

            "morning_peak": (
                morning_summary
            ),

            "evening_peak": (
                evening_summary
            ),

        },

    }


# ============================================================
# 15-MINUTE HISTORICAL TREND
# ============================================================

@router.get(
    "/corridor/{corridor_id}/trend"
)
def get_corridor_trend(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id
            == corridor_id
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:

        return {

            "corridor_id": corridor_id,

            "observation_count": 0,

            "interval_minutes": 15,

            "data": [],

        }

    trend_data = []

    for observation in observations:

        trend_data.append({

            "id": observation.id,

            "observed_at": (
                observation.observed_at.isoformat()
                if observation.observed_at
                else None
            ),

            "travel_time_minutes": round(
                observation.travel_time_minutes,
                2,
            ),

            "average_speed_kmh": round(
                observation.average_speed_kmh,
                2,
            ),

            "distance_km": round(
                observation.distance_km,
                3,
            ),

            "traffic_condition": (
                observation.traffic_condition
            ),

            "data_source": (
                observation.data_source
            ),

        })

    return {

        "corridor_id": corridor_id,

        "observation_count": len(
            trend_data
        ),

        "interval_minutes": 15,

        "data": trend_data,

    }


# ============================================================
# RECENT 24-HOUR ANALYSIS
# ============================================================

@router.get(
    "/corridor/{corridor_id}/recent"
)
def get_recent_corridor_analysis(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    now = datetime.now(
        timezone.utc
    )

    start_time = (
        now - timedelta(hours=24)
    )

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id
            == corridor_id,

            TrafficObservation.observed_at
            >= start_time,
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:

        return {

            "corridor_id": corridor_id,

            "period": "last_24_hours",

            "observation_count": 0,

            "average_travel_time_minutes":
                None,

            "average_speed_kmh":
                None,

            "data": [],

        }

    average_travel_time = (
        sum(
            observation.travel_time_minutes
            for observation in observations
        )
        / len(observations)
    )

    average_speed = (
        sum(
            observation.average_speed_kmh
            for observation in observations
        )
        / len(observations)
    )

    data = []

    for observation in observations:

        data.append({

            "id": observation.id,

            "observed_at": (
                observation.observed_at.isoformat()
                if observation.observed_at
                else None
            ),

            "travel_time_minutes": round(
                observation.travel_time_minutes,
                2,
            ),

            "average_speed_kmh": round(
                observation.average_speed_kmh,
                2,
            ),

            "traffic_condition": (
                observation.traffic_condition
            ),

        })

    return {

        "corridor_id": corridor_id,

        "period": "last_24_hours",

        "observation_count": len(
            observations
        ),

        "average_travel_time_minutes": (
            round(
                average_travel_time,
                2,
            )
        ),

        "average_speed_kmh": (
            round(
                average_speed,
                2,
            )
        ),

        "data": data,

    }


# ============================================================
# ACTIVE CORRIDOR COMPARISON
# ============================================================

@router.get(
    "/corridors/comparison"
)
def get_corridor_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    corridors = (
        db.query(Corridor)
        .filter(
            Corridor.status == "Active"
        )
        .all()
    )

    results = []

    for corridor in corridors:

        latest_observation = (
            db.query(TrafficObservation)
            .filter(
                TrafficObservation.corridor_id
                == corridor.id
            )
            .order_by(
                TrafficObservation.observed_at.desc()
            )
            .first()
        )

        if not latest_observation:

            results.append({

                "corridor_id":
                    corridor.id,

                "corridor_name":
                    corridor.name,

                "origin":
                    corridor.origin,

                "destination":
                    corridor.destination,

                "distance_km":
                    round(
                        latest_observation.distance_km,
                        3,
                    ),

                "travel_time_minutes":
                    None,

                "average_speed_kmh":
                    None,

                "traffic_condition":
                    "No Data",

                "observed_at":
                    None,

                "data_source":
                    None,

            })

            continue

        results.append({

            "corridor_id":
                corridor.id,

            "corridor_name":
                corridor.name,

            "origin":
                corridor.origin,

            "destination":
                corridor.destination,

            "distance_km":
                round(
                    corridor.distance_km,
                    3,
                ),

            "travel_time_minutes":
                round(
                    latest_observation
                    .travel_time_minutes,
                    2,
                ),

            "average_speed_kmh":
                round(
                    latest_observation
                    .average_speed_kmh,
                    2,
                ),

            "traffic_condition":
                latest_observation
                .traffic_condition,

            "observed_at":
                (
                    latest_observation
                    .observed_at
                    .isoformat()
                    if latest_observation
                    .observed_at
                    else None
                ),

            "data_source":
                latest_observation
                .data_source,

        })

    results.sort(

        key=lambda item: (

            item["average_speed_kmh"]
            is None,

            -(
                item["average_speed_kmh"]
                or 0
            ),

        )

    )

    return {

        "corridor_count":
            len(results),

        "data":
            results,

    }




# ============================================================
# TIME-PERIOD HISTORICAL BASELINE
# ============================================================

@router.get(
    "/corridor/{corridor_id}/period-baseline"
)
def get_corridor_period_baseline(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Calculate historical traffic baselines for
    different periods of the day.
    """

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id
            == corridor_id
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:
        return {
            "corridor_id": corridor_id,
            "observation_count": 0,
            "baseline_available": False,
            "periods": [],
            "message": (
                "No historical observations "
                "are available for this corridor."
            ),
        }

    period_groups = {
        "Night": [],
        "Morning Peak": [],
        "Midday": [],
        "Evening Peak": [],
        "Evening/Night": [],
    }

    period_times = {
        "Night": "00:00 - 06:59",
        "Morning Peak": "07:00 - 09:59",
        "Midday": "10:00 - 15:59",
        "Evening Peak": "16:00 - 18:59",
        "Evening/Night": "19:00 - 23:59",
    }

    for observation in observations:
        hour = observation.observed_at.hour

        if 0 <= hour < 7:
            period_groups["Night"].append(observation)
        elif 7 <= hour < 10:
            period_groups["Morning Peak"].append(observation)
        elif 10 <= hour < 16:
            period_groups["Midday"].append(observation)
        elif 16 <= hour < 19:
            period_groups["Evening Peak"].append(observation)
        else:
            period_groups["Evening/Night"].append(observation)

    periods = []

    for period_name, period_observations in period_groups.items():

        if not period_observations:
            periods.append({
                "period": period_name,
                "time_range": period_times[period_name],
                "observation_count": 0,
                "baseline_available": False,
                "average_travel_time_minutes": None,
                "average_speed_kmh": None,
                "minimum_travel_time_minutes": None,
                "maximum_travel_time_minutes": None,
            })
            continue

        travel_times = [
            o.travel_time_minutes
            for o in period_observations
        ]

        speeds = [
            o.average_speed_kmh
            for o in period_observations
        ]

        periods.append({
            "period": period_name,
            "time_range": period_times[period_name],
            "observation_count": len(period_observations),
            "baseline_available": len(period_observations) >= 2,
            "average_travel_time_minutes": round(
                sum(travel_times) / len(travel_times),
                2,
            ),
            "average_speed_kmh": round(
                sum(speeds) / len(speeds),
                2,
            ),
            "minimum_travel_time_minutes": round(
                min(travel_times),
                2,
            ),
            "maximum_travel_time_minutes": round(
                max(travel_times),
                2,
            ),
        })

    return {
        "corridor_id": corridor_id,
        "observation_count": len(observations),
        "baseline_available": len(observations) >= 2,
        "periods": periods,
    }

# ============================================================
# CURRENT VS TIME-PERIOD BASELINE COMPARISON
# ============================================================

@router.get(
    "/corridor/{corridor_id}/period-comparison"
)
def get_corridor_period_comparison(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Compare the latest traffic observation with
    the historical baseline for the same period
    of the day.
    """

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id
            == corridor_id
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )

    if not observations:
        return {
            "corridor_id": corridor_id,
            "observation_count": 0,
            "baseline_available": False,
            "message": (
                "No observations are available "
                "for this corridor."
            ),
        }

    # --------------------------------------------------------
    # Latest observation
    # --------------------------------------------------------

    latest_observation = observations[-1]

    latest_hour = (
        latest_observation
        .observed_at
        .hour
    )

    current_period = get_time_period(
        latest_hour
    )

    # --------------------------------------------------------
    # Historical observations from SAME period
    # Exclude the current/latest observation
    # --------------------------------------------------------

    historical_observations = [

        observation

        for observation in observations[:-1]

        if get_time_period(
            observation.observed_at.hour
        ) == current_period

    ]

    # --------------------------------------------------------
    # Not enough historical data
    # --------------------------------------------------------

    if not historical_observations:

        return {

            "corridor_id":
                corridor_id,

            "observation_count":
                len(observations),

            "baseline_available":
                False,

            "current_period":
                current_period,

            "current": {

                "travel_time_minutes":
                    round(
                        latest_observation
                        .travel_time_minutes,
                        2,
                    ),

                "average_speed_kmh":
                    round(
                        latest_observation
                        .average_speed_kmh,
                        2,
                    ),

                "traffic_condition":
                    latest_observation
                    .traffic_condition,

                "observed_at":
                    (
                        latest_observation
                        .observed_at
                        .isoformat()
                        if latest_observation
                        .observed_at
                        else None
                    ),

            },

            "historical_observation_count":
                0,

            "message":
                (
                    "Not enough historical observations "
                    "are available for the current "
                    "time period."
                ),

        }

    # --------------------------------------------------------
    # Historical values
    # --------------------------------------------------------

    historical_travel_times = [

        observation.travel_time_minutes

        for observation
        in historical_observations

    ]

    historical_speeds = [

        observation.average_speed_kmh

        for observation
        in historical_observations

    ]

    baseline_travel_time = (

        sum(
            historical_travel_times
        )

        / len(
            historical_travel_times
        )

    )

    baseline_speed = (

        sum(
            historical_speeds
        )

        / len(
            historical_speeds
        )

    )

    # --------------------------------------------------------
    # Current values
    # --------------------------------------------------------

    current_travel_time = (
        latest_observation
        .travel_time_minutes
    )

    current_speed = (
        latest_observation
        .average_speed_kmh
    )

    # --------------------------------------------------------
    # Travel time comparison
    # --------------------------------------------------------

    travel_time_difference = (

        current_travel_time
        - baseline_travel_time

    )

    delay_percentage = (

        (
            travel_time_difference
            / baseline_travel_time
        )
        * 100

        if baseline_travel_time > 0

        else 0

    )

    # --------------------------------------------------------
    # Speed comparison
    # --------------------------------------------------------

    speed_difference = (

        current_speed
        - baseline_speed

    )

    speed_change_percentage = (

        (
            speed_difference
            / baseline_speed
        )
        * 100

        if baseline_speed > 0

        else 0

    )

    # --------------------------------------------------------
    # Congestion classification
    # --------------------------------------------------------

    congestion_level = (
        determine_baseline_congestion(
            delay_percentage
        )
    )

    traffic_alert = determine_traffic_alert(
        delay_percentage
    )

    # --------------------------------------------------------
    # Normal / Above Normal / Below Normal
    # --------------------------------------------------------

    if delay_percentage > 10:

        comparison_status = (
            "Above Normal"
        )

    elif delay_percentage < -10:

        comparison_status = (
            "Below Normal"
        )

    else:

        comparison_status = (
            "Normal"
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "corridor_id":
            corridor_id,

        "observation_count":
            len(observations),

        "baseline_available":
            True,

        "current_period":
            current_period,

        "current": {

            "travel_time_minutes":
                round(
                    current_travel_time,
                    2,
                ),

            "average_speed_kmh":
                round(
                    current_speed,
                    2,
                ),

            "traffic_condition":
                latest_observation
                .traffic_condition,

            "observed_at":
                (
                    latest_observation
                    .observed_at
                    .isoformat()
                    if latest_observation
                    .observed_at
                    else None
                ),

        },

        "historical_baseline": {

            "observation_count":
                len(
                    historical_observations
                ),

            "average_travel_time_minutes":
                round(
                    baseline_travel_time,
                    2,
                ),

            "average_speed_kmh":
                round(
                    baseline_speed,
                    2,
                ),

            "minimum_travel_time_minutes":
                round(
                    min(
                        historical_travel_times
                    ),
                    2,
                ),

            "maximum_travel_time_minutes":
                round(
                    max(
                        historical_travel_times
                    ),
                    2,
                ),

        },

        "comparison": {

            "travel_time_difference_minutes":
                round(
                    travel_time_difference,
                    2,
                ),

            "delay_percentage":
                round(
                    delay_percentage,
                    2,
                ),

            "speed_difference_kmh":
                round(
                    speed_difference,
                    2,
                ),

            "speed_change_percentage":
                round(
                    speed_change_percentage,
                    2,
                ),

            "status":
                comparison_status,

        },

        "congestion": {

            "level":
                congestion_level,

            "description":
                get_congestion_description(
                    congestion_level
                ),

        },

        "traffic_alert": traffic_alert,

    }


# ============================================================
# TIME PERIOD HELPER
# ============================================================

def get_time_period(
    hour: int,
) -> str:

    if 0 <= hour < 7:

        return "Night"

    if 7 <= hour < 10:

        return "Morning Peak"

    if 10 <= hour < 16:

        return "Midday"

    if 16 <= hour < 19:

        return "Evening Peak"

    return "Evening/Night"


# ============================================================
# HISTORICAL BASELINE / CONGESTION ANALYSIS
# ============================================================

@router.get(
    "/corridor/{corridor_id}/baseline"
)
def get_corridor_baseline(
    corridor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    """
    Compare the latest traffic observation
    against the historical average for the
    same corridor.

    The historical average is calculated from
    all available observations for the corridor.
    """

    # --------------------------------------------------------
    # Get all observations
    # --------------------------------------------------------

    observations = (
        db.query(TrafficObservation)
        .filter(
            TrafficObservation.corridor_id
            == corridor_id
        )
        .order_by(
            TrafficObservation.observed_at
        )
        .all()
    )


    # --------------------------------------------------------
    # No data
    # --------------------------------------------------------

    if not observations:

        return {

            "corridor_id":
                corridor_id,

            "observation_count":
                0,

            "baseline_available":
                False,

            "message":
                "Not enough historical observations to calculate a baseline.",

        }


    # --------------------------------------------------------
    # Historical baseline
    # --------------------------------------------------------

    historical_travel_times = [

        observation.travel_time_minutes

        for observation in observations

    ]


    historical_speeds = [

        observation.average_speed_kmh

        for observation in observations

    ]


    baseline_travel_time = (

        sum(
            historical_travel_times
        )

        / len(
            historical_travel_times
        )

    )


    baseline_speed = (

        sum(
            historical_speeds
        )

        / len(
            historical_speeds
        )

    )


    # --------------------------------------------------------
    # Latest observation
    # --------------------------------------------------------

    latest_observation = (

        observations[-1]

    )


    current_travel_time = (

        latest_observation
        .travel_time_minutes

    )


    current_speed = (

        latest_observation
        .average_speed_kmh

    )


    # --------------------------------------------------------
    # Delay calculation
    #
    # Positive = slower than normal
    # Negative = faster than normal
    # --------------------------------------------------------

    travel_time_difference = (

        current_travel_time
        - baseline_travel_time

    )


    delay_percentage = (

        (
            travel_time_difference
            / baseline_travel_time
        )
        * 100

    )


    # --------------------------------------------------------
    # Speed difference
    # --------------------------------------------------------

    speed_difference = (

        current_speed
        - baseline_speed

    )


    speed_change_percentage = (

        (
            speed_difference
            / baseline_speed
        )
        * 100

    )


    # --------------------------------------------------------
    # Congestion classification
    #
    # Based on percentage increase in travel
    # time compared with historical baseline.
    # --------------------------------------------------------

    congestion_level = (
        determine_baseline_congestion(
            delay_percentage
        )
    )


    # --------------------------------------------------------
    # Historical condition distribution
    # --------------------------------------------------------

    condition_counts = {}

    for observation in observations:

        condition = (
            observation.traffic_condition
        )

        condition_counts[condition] = (

            condition_counts.get(
                condition,
                0,
            )

            + 1

        )


    # --------------------------------------------------------
    # Baseline period
    # --------------------------------------------------------

    first_observation = (
        observations[0]
    )


    last_observation = (
        observations[-1]
    )


    return {

        "corridor_id":
            corridor_id,

        "observation_count":
            len(observations),

        "baseline_available":
            len(observations) >= 2,

        "baseline_period": {

            "start":
                (
                    first_observation
                    .observed_at
                    .isoformat()
                    if first_observation
                    .observed_at
                    else None
                ),

            "end":
                (
                    last_observation
                    .observed_at
                    .isoformat()
                    if last_observation
                    .observed_at
                    else None
                ),

        },

        "historical_baseline": {

            "average_travel_time_minutes":
                round(
                    baseline_travel_time,
                    2,
                ),

            "average_speed_kmh":
                round(
                    baseline_speed,
                    2,
                ),

        },

        "current": {

            "travel_time_minutes":
                round(
                    current_travel_time,
                    2,
                ),

            "average_speed_kmh":
                round(
                    current_speed,
                    2,
                ),

            "traffic_condition":
                latest_observation
                .traffic_condition,

            "observed_at":
                (
                    latest_observation
                    .observed_at
                    .isoformat()
                    if latest_observation
                    .observed_at
                    else None
                ),

        },

        "comparison": {

            "travel_time_difference_minutes":
                round(
                    travel_time_difference,
                    2,
                ),

            "delay_percentage":
                round(
                    delay_percentage,
                    2,
                ),

            "speed_difference_kmh":
                round(
                    speed_difference,
                    2,
                ),

            "speed_change_percentage":
                round(
                    speed_change_percentage,
                    2,
                ),

        },

        "congestion": {

            "level":
                congestion_level,

            "description":
                get_congestion_description(
                    congestion_level
                ),

        },

        "historical_condition_distribution":
            condition_counts,

    }


# ============================================================
# BASELINE CONGESTION CLASSIFICATION
# ============================================================

def determine_baseline_congestion(
    delay_percentage: float,
):
    """
    Classify congestion based on how much
    longer the current travel time is compared
    with the corridor's historical baseline.
    """

    if delay_percentage <= 10:

        return "Free Flow"


    if delay_percentage <= 25:

        return "Light"


    if delay_percentage <= 50:

        return "Moderate"


    if delay_percentage <= 75:

        return "Heavy"


    return "Severe"


# ============================================================
# CONGESTION DESCRIPTION
# ============================================================

def get_congestion_description(
    congestion_level: str,
):

    descriptions = {

        "Free Flow":
            "Travel time is close to or below the historical corridor baseline.",

        "Light":
            "Travel time is slightly above the historical corridor baseline.",

        "Moderate":
            "Travel time is noticeably above the historical corridor baseline.",

        "Heavy":
            "Travel time is substantially above the historical corridor baseline.",

        "Severe":
            "Travel time is significantly above the historical corridor baseline.",

    }


    return descriptions.get(

        congestion_level,

        "Traffic condition could not be determined.",

    )


# ============================================================
# PEAK SUMMARY HELPER
# ============================================================

def calculate_peak_summary(
    observations,
):

    if not observations:

        return None

    average_travel_time = (

        sum(
            item[
                "average_travel_time_minutes"
            ]
            for item in observations
        )

        / len(observations)

    )

    average_speed = (

        sum(
            item[
                "average_speed_kmh"
            ]
            for item in observations
        )

        / len(observations)

    )

    peak_hour = max(

        observations,

        key=lambda item:
            item[
                "average_travel_time_minutes"
            ],

    )

    return {

        "observation_hours": len(
            observations
        ),

        "average_travel_time_minutes": (
            round(
                average_travel_time,
                2,
            )
        ),

        "average_speed_kmh": (
            round(
                average_speed,
                2,
            )
        ),

        "worst_hour": {

            "date":
                peak_hour["date"],

            "hour":
                peak_hour["hour"],

            "average_travel_time_minutes":
                peak_hour[
                    "average_travel_time_minutes"
                ],

            "average_speed_kmh":
                peak_hour[
                    "average_speed_kmh"
                ],

            "condition":
                peak_hour[
                    "dominant_condition"
                ],

        },

    }

# ============================================================
# TRAFFIC ALERT CLASSIFICATION
# ============================================================

def determine_traffic_alert(
    delay_percentage: float,
) -> dict:
    """
    Classify current traffic performance
    against the historical baseline.
    """

    if delay_percentage > 50:

        return {
            "level": "Critical",
            "severity": 4,
            "message": (
                "Travel time is more than "
                "50% above the historical baseline."
            ),
        }

    if delay_percentage > 25:

        return {
            "level": "Congested",
            "severity": 3,
            "message": (
                "Travel time is more than "
                "25% above the historical baseline."
            ),
        }

    if delay_percentage > 10:

        return {
            "level": "Above Normal",
            "severity": 2,
            "message": (
                "Travel time is more than "
                "10% above the historical baseline."
            ),
        }

    return {
        "level": "Normal",
        "severity": 1,
        "message": (
            "Traffic is within the normal "
            "historical range."
        ),
    }

