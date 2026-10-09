import { useEffect, useRef, useState } from "react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { importLibrary } from "../services/googleMaps";


const API_URL = "http://127.0.0.1:8000";


// ============================================================
// TYPES
// ============================================================

interface Corridor {
  id: number;
  name: string;

  origin: string;
  origin_latitude: number;
  origin_longitude: number;

  destination: string;
  destination_latitude: number;
  destination_longitude: number;

  distance_km: number;
}


interface CorridorAnalytics {
  corridor_id: number;

  observation_count: number;

  average_distance_km: number;

  average_travel_time_minutes: number;

  minimum_travel_time_minutes: number;

  maximum_travel_time_minutes: number;

  average_speed_kmh: number;

  minimum_speed_kmh: number;

  maximum_speed_kmh: number;

  traffic_distribution: Record<
    string,
    number
  >;

  most_common_condition: string;
}


interface TrendObservation {
  id: number;

  observed_at: string;

  travel_time_minutes: number;

  average_speed_kmh: number;

  distance_km: number;

  traffic_condition: string;

  data_source: string;
}


interface TrendResponse {
  corridor_id: number;

  observation_count: number;

  interval_minutes: number;

  data: TrendObservation[];
}


interface HourlyAnalysis {
  date: string;

  hour: number;

  observation_count: number;

  average_travel_time_minutes: number;

  average_speed_kmh: number;

  dominant_condition: string;
}


interface PeakSummary {
  observation_hours: number;

  average_travel_time_minutes: number;

  average_speed_kmh: number;

  worst_hour: {
    date: string;

    hour: number;

    average_travel_time_minutes: number;

    average_speed_kmh: number;

    condition: string;
  };
}


interface TimeAnalysis {
  corridor_id: number;

  observation_count: number;

  hourly_analysis: HourlyAnalysis[];

  peak_analysis: {
    morning_peak: PeakSummary | null;

    evening_peak: PeakSummary | null;
  };
}


interface FifteenMinuteData {
  period: string;

  timestamp: string;

  observation_count: number;

  average_travel_time_minutes: number;

  average_speed_kmh: number;

  dominant_condition: string;
}


interface RecentObservation {
  id: number;

  observed_at: string;

  travel_time_minutes: number;

  average_speed_kmh: number;

  traffic_condition: string;
}


interface RecentAnalysis {
  corridor_id: number;

  period: string;

  observation_count: number;

  average_travel_time_minutes:
    | number
    | null;

  average_speed_kmh:
    | number
    | null;

  data: RecentObservation[];
}

interface CorridorComparisonItem {
  corridor_id: number;
  corridor_name: string;
  origin: string;
  destination: string;
  distance_km: number;
  travel_time_minutes: number | null;
  average_speed_kmh: number | null;
  traffic_condition: string;
  observed_at: string | null;
  data_source: string | null;
}

interface CorridorComparisonResponse {
  corridor_count: number;
  data: CorridorComparisonItem[];
}

interface BaselineAnalysis {
  corridor_id: number;
  observation_count: number;
  baseline_available: boolean;

  baseline_period?: {
    start: string | null;
    end: string | null;
  };

  historical_baseline?: {
    average_travel_time_minutes: number;
    average_speed_kmh: number;
  };

  current?: {
    travel_time_minutes: number;
    average_speed_kmh: number;
    traffic_condition: string;
    observed_at: string | null;
  };

  comparison?: {
    travel_time_difference_minutes: number;
    delay_percentage: number;
    speed_difference_kmh: number;
    speed_change_percentage: number;
  };

  congestion?: {
    level: string;
    description: string;
  };

  historical_condition_distribution?: Record<string, number>;

  message?: string;
}

interface PeriodBaseline {
  period: string;
  time_range: string;
  observation_count: number;
  baseline_available: boolean;
  average_travel_time_minutes: number | null;
  average_speed_kmh: number | null;
  minimum_travel_time_minutes: number | null;
  maximum_travel_time_minutes: number | null;
}

interface PeriodBaselineResponse {
  corridor_id: number;
  observation_count: number;
  baseline_available: boolean;
  periods: PeriodBaseline[];
  message?: string;
}

interface PeriodComparisonResponse {
  corridor_id: number;
  observation_count: number;
  baseline_available: boolean;
  current_period?: string;

  current?: {
    travel_time_minutes: number;
    average_speed_kmh: number;
    traffic_condition: string;
    observed_at: string | null;
  };

  historical_baseline?: {
    observation_count: number;
    average_travel_time_minutes: number;
    average_speed_kmh: number;
    minimum_travel_time_minutes: number;
    maximum_travel_time_minutes: number;
  };

  comparison?: {
    travel_time_difference_minutes: number;
    delay_percentage: number;
    speed_difference_kmh: number;
    speed_change_percentage: number;
    status: string;
  };

  congestion?: {
    level: string;
    description: string;
  };

  historical_observation_count?: number;

  message?: string;

  traffic_alert?: {
  level: string;
  severity: number;
  message: string;
};
}


// ============================================================
// MAIN ANALYTICS PAGE
// ============================================================

export default function Analytics() {

  const [corridors, setCorridors] =
    useState<Corridor[]>([]);


  const [selectedCorridor, setSelectedCorridor] =
    useState<number | null>(null);

  const [analysisDays, setAnalysisDays] =
    useState<number>(30);


  const [selectedCorridorData, setSelectedCorridorData] =
    useState<Corridor | null>(null);


  const [analytics, setAnalytics] =
    useState<CorridorAnalytics | null>(null);


  const [timeAnalysis, setTimeAnalysis] =
    useState<TimeAnalysis | null>(null);


  const [trend, setTrend] =
    useState<TrendResponse | null>(null);


  const [recentAnalysis, setRecentAnalysis] =
    useState<RecentAnalysis | null>(null);

  const [periodComparison, setPeriodComparison] =
    useState<PeriodComparisonResponse | null>(null);

  const [corridorComparison, setCorridorComparison] =
    useState<CorridorComparisonResponse | null>(null);

  const [comparisonLoading, setComparisonLoading] =
    useState(true);

  const [baseline, setBaseline] =
    useState<BaselineAnalysis | null>(null);

  const [baselineLoading, setBaselineLoading] =
    useState(false);

  const [periodBaseline, setPeriodBaseline] =
    useState<PeriodBaselineResponse | null>(null);

  const [periodBaselineLoading, setPeriodBaselineLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);


  const [, setAnalyticsLoading] =
    useState(false);


  const [mapLoading, setMapLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  // ============================================================
  // MAP REFERENCES
  // ============================================================

  const mapRef =
    useRef<HTMLDivElement>(null);


  const mapInstanceRef =
    useRef<google.maps.Map | null>(null);


  const originMarkerRef =
    useRef<
      google.maps.marker.AdvancedMarkerElement | null
    >(null);


  const destinationMarkerRef =
    useRef<
      google.maps.marker.AdvancedMarkerElement | null
    >(null);


  const routePolylineRef =
    useRef<google.maps.Polyline | null>(null);


  // ============================================================
  // LOAD CORRIDORS
  // ============================================================

  useEffect(() => {
    const fetchCorridors = async () => {
      try {
        const token =
          localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/corridors`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch corridors"
          );
        }

        const data: Corridor[] =
          await response.json();

        setCorridors(data);

        // Automatically select the first corridor
        // only when no corridor is currently selected.
        if (data.length > 0) {
          setSelectedCorridor(
            (current) =>
              current ?? data[0].id
          );
        }
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load corridors."
        );
      } finally {
        setLoading(false);
      }
    };

    // Load immediately
    fetchCorridors();

    // Check for newly created corridors every minute
    const interval = window.setInterval(
      fetchCorridors,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);


  // ============================================================
  // LOAD CORRIDOR COMPARISON
  // ============================================================

  useEffect(() => {
    const fetchCorridorComparison = async () => {
      try {
        setComparisonLoading(true);

        const token =
          localStorage.getItem("access_token");

        const response = await fetch(
          `${API_URL}/analytics/corridors/comparison`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch corridor comparison"
          );
        }

        const data: CorridorComparisonResponse =
          await response.json();

        setCorridorComparison(data);
      } catch (err) {
        console.error(
          "Corridor comparison error:",
          err
        );

        setCorridorComparison(null);
      } finally {
        setComparisonLoading(false);
      }
    };

    // Load immediately
    fetchCorridorComparison();

    // Refresh every minute
    const interval = window.setInterval(
      fetchCorridorComparison,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);


  // ============================================================
  // GET SELECTED CORRIDOR
  // ============================================================

  useEffect(() => {

    if (
      selectedCorridor === null
    ) {

      return;

    }


    const corridor =
      corridors.find(
        (item) =>
          item.id ===
          selectedCorridor
      );


    setSelectedCorridorData(
      corridor ?? null
    );

  }, [
    selectedCorridor,
    corridors,
  ]);


  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  useEffect(() => {

    if (
      selectedCorridor === null
    ) {

      return;

    }


    const fetchAnalytics =
      async () => {

        try {

          setAnalyticsLoading(
            true
          );
          setBaselineLoading(
            true
          );
          setPeriodBaselineLoading(
            true
          );

          setError("");


          const token =
            localStorage.getItem(
              "access_token"
            );


          const headers = {

            Authorization:
              `Bearer ${token}`,

          };


          const [
            analyticsResponse,
            timeAnalysisResponse,
            trendResponse,
            recentResponse,
            baselineResponse,
            periodBaselineResponse,
            periodComparisonResponse,
          ] = await Promise.all([

            // --------------------------------------------------
            // BASIC ANALYTICS
            // --------------------------------------------------

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}?days=${analysisDays}`,
              {
                headers,
              }
            ),


            // --------------------------------------------------
            // TIME ANALYSIS
            // --------------------------------------------------

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/time-analysis?days=${analysisDays}`,
              {
                headers,
              }
            ),


            // --------------------------------------------------
            // 15-MINUTE TREND
            // --------------------------------------------------

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/trend?days=${analysisDays}`,
              {
                headers,
              }
            ),


            // --------------------------------------------------
            // LAST 24 HOURS
            // --------------------------------------------------

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/recent`,
              {
                headers,
              }
            ),

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/?days=${analysisDays}`,
              {
                headers,
              }
            ),

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/period-baseline?days=${analysisDays}`,
              {
                headers,
              }
            ),

            fetch(
              `${API_URL}/analytics/corridor/${selectedCorridor}/period-comparison?days=${analysisDays}`,
              {
                headers,
              }
            ),

          ]);


          if (
            !analyticsResponse.ok
          ) {

            throw new Error(
              "Failed to fetch corridor analytics"
            );

          }


          if (
            !timeAnalysisResponse.ok
          ) {

            throw new Error(
              "Failed to fetch time analysis"
            );

          }


          if (
            !trendResponse.ok
          ) {

            throw new Error(
              "Failed to fetch traffic trend"
            );

          }


          if (
            !recentResponse.ok
          ) {

            throw new Error(
              "Failed to fetch recent traffic analysis"
            );

          }


          const analyticsData =
            await analyticsResponse.json();

          if (analyticsData.observation_count === 0) {
            setAnalytics(null);
            setTimeAnalysis(null);
            setTrend(null);
            setRecentAnalysis(null);
            setPeriodComparison(null);
            setBaseline(null);
            setPeriodBaseline(null);

            return;
          }

          const timeData =
            await timeAnalysisResponse.json();


          const trendData =
            await trendResponse.json();


          const recentData =
            await recentResponse.json();

          const periodComparisonData =
            await periodComparisonResponse.json();
          
          const baselineData: BaselineAnalysis =
            await baselineResponse.json();

          const periodBaselineData:
          PeriodBaselineResponse =
          await periodBaselineResponse.json();

          setAnalytics(
            analyticsData
          );


          setTimeAnalysis(
            timeData
          );


          setTrend(
            trendData
          );


          setRecentAnalysis(
            recentData
          );

          setPeriodComparison(
            periodComparisonData
          );

          setBaseline(
            baselineData
          );

          setPeriodBaseline(
            periodBaselineData
          );

        } catch (err) {

          console.error(err);

          setAnalytics(null);

          setTimeAnalysis(null);

          setTrend(null);

          setRecentAnalysis(null);

          setPeriodComparison(null);

          setBaseline(null);

          setPeriodBaseline(null);

          setError(
            "Unable to load analytics data."
          );

        } finally {

          setAnalyticsLoading(
            false
          );
          setBaselineLoading(
            false
          );
          setPeriodBaselineLoading(
            false
          );

        }

      };


    fetchAnalytics();

  }, [selectedCorridor, analysisDays]);


  // ============================================================
  // INITIALIZE GOOGLE MAP
  // ============================================================

  useEffect(() => {

    let cancelled = false;


    const initializeMap =
      async () => {

        try {

          setMapLoading(true);


          const { Map } =
            (await importLibrary(
              "maps"
            )) as google.maps.MapsLibrary;


          await importLibrary(
            "marker"
          );


          await importLibrary(
            "routes"
          );


          if (
            cancelled ||
            !mapRef.current
          ) {

            return;

          }


          const defaultCenter = {

            lat: 6.877,

            lng: 79.86,

          };


          const map =
            new Map(
              mapRef.current,
              {

                center:
                  defaultCenter,

                zoom: 13,

                mapTypeControl:
                  true,

                streetViewControl:
                  false,

                fullscreenControl:
                  true,

                mapId:
                  "DEMO_MAP_ID",

              }
            );


          mapInstanceRef.current =
            map;


          setMapLoading(false);


        } catch (err) {

          console.error(
            "Google Maps failed to initialize:",
            err
          );


          setMapLoading(false);


          setError(
            "Unable to load Google Maps."
          );

        }

      };


    initializeMap();


    return () => {

      cancelled = true;

    };

  }, []);


  // ============================================================
  // UPDATE MAP WHEN CORRIDOR CHANGES
  // ============================================================

  useEffect(() => {

    if (
      !mapInstanceRef.current ||
      !selectedCorridorData
    ) {

      return;

    }


    const updateMap =
      async () => {

        try {

          const {
            AdvancedMarkerElement,
            PinElement,
          } =
            (await importLibrary(
              "marker"
            )) as google.maps.MarkerLibrary;


          await importLibrary(
            "routes"
          );


          const map =
            mapInstanceRef.current;


          if (!map) {

            return;

          }


          // ----------------------------------------------------
          // REMOVE PREVIOUS MARKERS
          // ----------------------------------------------------

          if (
            originMarkerRef.current
          ) {

            originMarkerRef.current.map =
              null;

          }


          if (
            destinationMarkerRef.current
          ) {

            destinationMarkerRef.current.map =
              null;

          }


          // ----------------------------------------------------
          // REMOVE PREVIOUS ROUTE
          // ----------------------------------------------------

          if (
            routePolylineRef.current
          ) {

            routePolylineRef.current.setMap(
              null
            );


            routePolylineRef.current =
              null;

          }


          // ----------------------------------------------------
          // CORRIDOR COORDINATES
          // ----------------------------------------------------

          const origin = {

            lat:
              selectedCorridorData
                .origin_latitude,

            lng:
              selectedCorridorData
                .origin_longitude,

          };


          const destination = {

            lat:
              selectedCorridorData
                .destination_latitude,

            lng:
              selectedCorridorData
                .destination_longitude,

          };


          // ----------------------------------------------------
          // ORIGIN MARKER - A
          // ----------------------------------------------------

          const originPin =
            new PinElement({

              glyph: "A",

            });


          originMarkerRef.current =
            new AdvancedMarkerElement({

              map,

              position:
                origin,

              title:
                selectedCorridorData
                  .origin,

              content:
                originPin.element,

            });


          // ----------------------------------------------------
          // DESTINATION MARKER - B
          // ----------------------------------------------------

          const destinationPin =
            new PinElement({

              glyph: "B",

            });


          destinationMarkerRef.current =
            new AdvancedMarkerElement({

              map,

              position:
                destination,

              title:
                selectedCorridorData
                  .destination,

              content:
                destinationPin.element,

            });


          // ----------------------------------------------------
          // GOOGLE ROAD ROUTE
          // ----------------------------------------------------

          const directionsService =
            new google.maps.DirectionsService();


          directionsService.route(

            {

              origin,

              destination,

              travelMode:
                google.maps.TravelMode.DRIVING,

              provideRouteAlternatives:
                false,

            },

            (
              result,
              status
            ) => {

              if (
                status !==
                  google.maps.DirectionsStatus.OK ||
                !result
              ) {

                console.error(
                  "Google Directions failed:",
                  status
                );


                // Fallback straight line

                routePolylineRef.current =
                  new google.maps.Polyline({

                    path: [
                      origin,
                      destination,
                    ],

                    geodesic: true,

                    strokeOpacity: 0.9,

                    strokeWeight: 5,

                  });


                routePolylineRef.current.setMap(
                  map
                );


                return;

              }


              const route =
                result.routes[0];


              if (
                !route ||
                !route.overview_path
              ) {

                return;

              }


              // ------------------------------------------------
              // DRAW ACTUAL ROAD ROUTE
              // ------------------------------------------------

              routePolylineRef.current =
                new google.maps.Polyline({

                  path:
                    route.overview_path,

                  geodesic: true,

                  strokeOpacity: 0.9,

                  strokeWeight: 5,

                });


              routePolylineRef.current.setMap(
                map
              );


              // ------------------------------------------------
              // FIT MAP TO ROUTE
              // ------------------------------------------------

              const bounds =
                new google.maps.LatLngBounds();


              route.overview_path.forEach(
                (point) => {

                  bounds.extend(
                    point
                  );

                }
              );


              map.fitBounds(
                bounds
              );


              // ------------------------------------------------
              // DEBUG INFORMATION
              // ------------------------------------------------

              if (
                route.legs &&
                route.legs.length > 0
              ) {

                const leg =
                  route.legs[0];


                console.log(
                  "================================"
                );


                console.log(
                  "M-TRADA Google Road Route"
                );


                console.log(
                  "================================"
                );


                console.log(
                  "Origin:",
                  selectedCorridorData
                    .origin
                );


                console.log(
                  "Destination:",
                  selectedCorridorData
                    .destination
                );


                console.log(
                  "Database Distance:",
                  selectedCorridorData
                    .distance_km,
                  "km"
                );


                console.log(
                  "Google Road Distance:",
                  leg.distance?.text
                );


                console.log(
                  "Google Road Duration:",
                  leg.duration?.text
                );


                console.log(
                  "================================"
                );

              }

            }

          );

        } catch (err) {

          console.error(
            "Failed to update corridor map:",
            err
          );

        }

      };


    updateMap();

  }, [
    selectedCorridorData,
  ]);


  // ============================================================
  // 15-MINUTE AGGREGATION
  // ============================================================

  const fifteenMinuteData =
    createFifteenMinuteData(
      trend?.data ?? []
    );


  // ============================================================
  // HOURLY CHART DATA
  // ============================================================

  const hourlyChartData =
    timeAnalysis?.hourly_analysis.map(
      (item) => ({

        hour:
          formatHour(
            item.hour
          ),

        travelTime:
          item.average_travel_time_minutes,

        speed:
          item.average_speed_kmh,

        observations:
          item.observation_count,

        condition:
          item.dominant_condition,

      })
    ) ?? [];


  // ============================================================
  // 24-HOUR CHART DATA
  // ============================================================

  const recentChartData =
    recentAnalysis?.data.map(
      (item) => ({

        time:
          formatDateTime(
            new Date(
              item.observed_at
            )
          ),

        travelTime:
          item.travel_time_minutes,

        speed:
          item.average_speed_kmh,

        condition:
          item.traffic_condition,

      })
    ) ?? [];


  // ============================================================
  // CORRIDOR COMPARISON SUMMARY
  // ============================================================

  const comparisonData =
    corridorComparison?.data ?? [];

  const corridorsWithData =
    comparisonData.filter(
      (item) =>
        item.average_speed_kmh !== null
    );

  const bestCorridor =
    corridorsWithData.length > 0
      ? [...corridorsWithData].sort(
          (a, b) =>
            (b.average_speed_kmh ?? 0) -
            (a.average_speed_kmh ?? 0)
        )[0]
      : null;

  const worstCorridor =
    corridorsWithData.length > 0
      ? [...corridorsWithData].sort(
          (a, b) =>
            (a.average_speed_kmh ?? 0) -
            (b.average_speed_kmh ?? 0)
        )[0]
      : null;


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="p-8">

        <p className="text-slate-500">

          Loading corridors...

        </p>

      </div>

    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="max-w-7xl mx-auto">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-slate-900">

            Traffic Analytics

          </h1>


          <p className="text-slate-500 mt-2">

            Analyze historical traffic conditions
            collected from Google Routes API over the selected period.

          </p>

        </div>


        {/* ====================================================
            CORRIDOR SELECTOR
            ==================================================== */}

        <div className="flex flex-col sm:flex-row gap-4">

        {/* CORRIDOR SELECTOR */}
        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Corridor
          </label>

          <select
            value={selectedCorridor ?? ""}
            onChange={(event) =>
              setSelectedCorridor(
                Number(event.target.value)
              )
            }
            className="border border-slate-300 rounded-lg px-4 py-2 bg-white min-w-[260px]"
          >

            {corridors.map((corridor) => (

              <option
                key={corridor.id}
                value={corridor.id}
              >
                {corridor.name}
              </option>

            ))}

          </select>

        </div>


        {/* ANALYSIS PERIOD */}
        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Analysis Period
          </label>

          <select
            value={analysisDays}
            onChange={(event) =>
              setAnalysisDays(
                Number(event.target.value)
              )
            }
            className="border border-slate-300 rounded-lg px-4 py-2 bg-white min-w-[180px]"
          >

            <option value={7}>
              Last 7 Days
            </option>

            <option value={14}>
              Last 14 Days
            </option>

            <option value={30}>
              Last 30 Days
            </option>

            <option value={60}>
              Last 60 Days
            </option>

            <option value={90}>
              Last 90 Days
            </option>

          </select>

        </div>

      </div>

      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (

        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">

          {error}

        </div>

      )}


      {/* ======================================================
          CORRIDOR COMPARISON
          ====================================================== */}

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Corridor Comparison
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Compare the latest traffic performance across all active corridors.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {corridorComparison
              ? `${corridorComparison.corridor_count} active corridors`
              : "Loading comparison..."}
          </div>

        </div>

        {comparisonLoading ? (
          <div className="h-40 flex items-center justify-center text-slate-500">
            Loading corridor comparison...
          </div>
        ) : comparisonData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-500">
            No corridor comparison data available yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Best Performing Corridor
                </p>

                <p className="font-semibold text-slate-900 mt-1">
                  {bestCorridor?.corridor_name ?? "No Data"}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {bestCorridor?.average_speed_kmh != null
                    ? `${bestCorridor.average_speed_kmh.toFixed(1)} km/h`
                    : "No observation"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Lowest Speed Corridor
                </p>

                <p className="font-semibold text-slate-900 mt-1">
                  {worstCorridor?.corridor_name ?? "No Data"}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {worstCorridor?.average_speed_kmh != null
                    ? `${worstCorridor.average_speed_kmh.toFixed(1)} km/h`
                    : "No observation"}
                </p>
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>
                  <tr className="border-b border-slate-200 text-left">

                    <th className="py-3 pr-4">
                      Corridor
                    </th>

                    <th className="py-3 pr-4">
                      Distance
                    </th>

                    <th className="py-3 pr-4">
                      Travel Time
                    </th>

                    <th className="py-3 pr-4">
                      Average Speed
                    </th>

                    <th className="py-3">
                      Condition
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {comparisonData.map((item) => (
                    <tr
                      key={item.corridor_id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >

                      <td className="py-4 pr-4">
                        <p className="font-medium text-slate-900">
                          {item.corridor_name}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {item.origin} → {item.destination}
                        </p>
                      </td>

                      <td className="py-4 pr-4">
                        {item.distance_km.toFixed(2)} km
                      </td>

                      <td className="py-4 pr-4">
                        {item.travel_time_minutes != null
                          ? `${item.travel_time_minutes.toFixed(2)} min`
                          : "—"}
                      </td>

                      <td className="py-4 pr-4 font-medium">
                        {item.average_speed_kmh != null
                          ? `${item.average_speed_kmh.toFixed(1)} km/h`
                          : "—"}
                      </td>

                      <td className="py-4">
                        <ConditionBadge
                          condition={item.traffic_condition}
                        />
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </>
        )}

      </div>


      {/* ======================================================
          ANALYTICS
          ====================================================== */}

      {analytics && (

        <>


          {/* ==================================================
              SUMMARY CARDS
              ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

            <MetricCard

              title="Observations"

              value={
                analytics
                  .observation_count
                  .toString()
              }

              description="Collected traffic records"

            />


            <MetricCard

              title="Average Travel Time"

              value={`${analytics.average_travel_time_minutes.toFixed(
                2
              )} min`}

              description="Historical average"

            />


            <MetricCard

              title="Average Speed"

              value={`${analytics.average_speed_kmh.toFixed(
                2
              )} km/h`}

              description="Historical average"

            />


            <MetricCard

              title="Traffic Condition"

              value={
                analytics
                  .most_common_condition
              }

              description="Most frequently observed"

            />

          </div>

          
          {/* ==================================================
              TRAFFIC PERFORMANCE SUMMARY
              ================================================== */}

          {periodComparison && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Traffic Performance Summary
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Current traffic performance compared with the
                    historical baseline for the current time period.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Current Period
                  </p>

                  <p className="font-semibold text-slate-900 mt-1">
                    {periodComparison.current_period ??
                      "Unknown"}
                  </p>
                </div>

              </div>

              {periodComparison.traffic_alert && (
                <div className="mt-5">
                  <TrafficAlertBanner
                    level={
                      periodComparison.traffic_alert.level
                    }
                    message={
                      periodComparison.traffic_alert.message
                    }
                  />
                </div>
              )}


              {/* MAIN STATUS */}

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 mb-6">

                <p className="text-sm text-slate-500">
                  Current Status
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2">

                  <p className="text-2xl font-bold text-slate-900">
                    {periodComparison.congestion?.level ??
                      periodComparison.current
                        ?.traffic_condition ??
                      "Unknown"}
                  </p>

                  <ComparisonStatusBadge
                    status={
                      periodComparison.comparison?.status ??
                      "Unknown"
                    }
                  />

                </div>

                {periodComparison.congestion?.description && (
                  <p className="text-sm text-slate-500 mt-3">
                    {periodComparison.congestion.description}
                  </p>
                )}

              </div>


              {/* PERFORMANCE METRICS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <BaselineMetric
                  title="Current Travel Time"
                  value={
                    periodComparison.current
                      ? `${periodComparison.current.travel_time_minutes.toFixed(
                          2
                        )} min`
                      : "—"
                  }
                />

                <BaselineMetric
                  title="Historical Normal"
                  value={
                    periodComparison.historical_baseline
                      ? `${periodComparison.historical_baseline.average_travel_time_minutes.toFixed(
                          2
                        )} min`
                      : "—"
                  }
                />

                <BaselineMetric
                  title="Delay"
                  value={
                    periodComparison.comparison
                      ? formatSignedPercentage(
                          periodComparison.comparison
                            .delay_percentage
                        )
                      : "—"
                  }
                />

                <BaselineMetric
                  title="Current Speed"
                  value={
                    periodComparison.current
                      ? `${periodComparison.current.average_speed_kmh.toFixed(
                          1
                        )} km/h`
                      : "—"
                  }
                />

              </div>


              {/* INTERPRETATION */}

              {periodComparison.comparison && (
                <div className="mt-6 pt-5 border-t border-slate-200">

                  <p className="text-sm text-slate-700">

                    <span className="font-semibold">
                      Performance:
                    </span>{" "}

                    {getPerformanceMessage(
                      periodComparison
                    )}

                  </p>

                </div>
              )}

            </div>
          )}

          {/* ==================================================
              HISTORICAL BASELINE
              ================================================== */}

          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Historical Baseline
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Compare the latest traffic observation with the
                historical performance of this corridor.
              </p>

            </div>

            {baselineLoading ? (

              <div className="h-32 flex items-center justify-center text-slate-500">
                Loading historical baseline...
              </div>

            ) : !baseline ? (

              <div className="h-32 flex items-center justify-center text-slate-500">
                Historical baseline is not available.
              </div>

            ) : !baseline.baseline_available ? (

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-5">

                <p className="font-medium text-slate-900">
                  Not enough historical data yet
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {baseline.message ??
                    "More observations are required before a reliable baseline can be calculated."}
                </p>

              </div>

            ) : (

              <>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                  <BaselineMetric
                    title="Historical Avg Travel Time"
                    value={`${baseline.historical_baseline?.average_travel_time_minutes.toFixed(2) ?? "—"} min`}
                  />

                  <BaselineMetric
                    title="Current Travel Time"
                    value={`${baseline.current?.travel_time_minutes.toFixed(2) ?? "—"} min`}
                  />

                  <BaselineMetric
                    title="Historical Avg Speed"
                    value={`${baseline.historical_baseline?.average_speed_kmh.toFixed(1) ?? "—"} km/h`}
                  />

                  <BaselineMetric
                    title="Current Speed"
                    value={`${baseline.current?.average_speed_kmh.toFixed(1) ?? "—"} km/h`}
                  />

                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                  <BaselineMetric
                    title="Travel Time Difference"
                    value={
                      baseline.comparison
                        ? `${baseline.comparison.travel_time_difference_minutes >= 0 ? "+" : ""}${baseline.comparison.travel_time_difference_minutes.toFixed(2)} min`
                        : "—"
                    }
                  />

                  <BaselineMetric
                    title="Delay"
                    value={
                      baseline.comparison
                        ? `${baseline.comparison.delay_percentage >= 0 ? "+" : ""}${baseline.comparison.delay_percentage.toFixed(1)}%`
                        : "—"
                    }
                  />

                  <BaselineMetric
                    title="Speed Change"
                    value={
                      baseline.comparison
                        ? `${baseline.comparison.speed_change_percentage >= 0 ? "+" : ""}${baseline.comparison.speed_change_percentage.toFixed(1)}%`
                        : "—"
                    }
                  />

                </div>


                <div className="mt-5 rounded-xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Current Congestion Level
                  </p>

                  <p className="text-xl font-semibold text-slate-900 mt-2">
                    {baseline.congestion?.level ?? "Unknown"}
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    {baseline.congestion?.description ??
                      "Congestion level could not be determined."}
                  </p>

                </div>

              </>

            )}

          </div>

          {/* ==================================================
              TIME-PERIOD HISTORICAL BASELINE
              ================================================== */}

          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

            <div className="mb-6">

              <h2 className="text-lg font-semibold text-slate-900">
                Time-Period Historical Baseline
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Historical traffic performance grouped by period of the day.
              </p>

            </div>


            {periodBaselineLoading ? (

              <div className="h-32 flex items-center justify-center text-slate-500">
                Loading time-period baseline...
              </div>

            ) : !periodBaseline ||
              periodBaseline.periods.length === 0 ? (

              <div className="h-32 flex items-center justify-center text-slate-500">
                No time-period baseline data available yet.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-slate-200 text-left">

                      <th className="py-3 pr-4">
                        Period
                      </th>

                      <th className="py-3 pr-4">
                        Time Range
                      </th>

                      <th className="py-3 pr-4">
                        Observations
                      </th>

                      <th className="py-3 pr-4">
                        Avg Travel Time
                      </th>

                      <th className="py-3 pr-4">
                        Avg Speed
                      </th>

                      <th className="py-3 pr-4">
                        Minimum Time
                      </th>

                      <th className="py-3 pr-4">
                        Maximum Time
                      </th>

                      <th className="py-3">
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {periodBaseline.periods.map(
                      (period) => (

                        <tr
                          key={period.period}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >

                          <td className="py-4 pr-4">

                            <p className="font-medium text-slate-900">
                              {period.period}
                            </p>

                          </td>


                          <td className="py-4 pr-4 text-slate-500">

                            {period.time_range}

                          </td>


                          <td className="py-4 pr-4">

                            {period.observation_count}

                          </td>


                          <td className="py-4 pr-4 font-medium">

                            {period.average_travel_time_minutes !==
                            null

                              ? `${period.average_travel_time_minutes.toFixed(
                                  2
                                )} min`

                              : "—"}

                          </td>


                          <td className="py-4 pr-4 font-medium">

                            {period.average_speed_kmh !==
                            null

                              ? `${period.average_speed_kmh.toFixed(
                                  1
                                )} km/h`

                              : "—"}

                          </td>


                          <td className="py-4 pr-4">

                            {period.minimum_travel_time_minutes !==
                            null

                              ? `${period.minimum_travel_time_minutes.toFixed(
                                  2
                                )} min`

                              : "—"}

                          </td>


                          <td className="py-4 pr-4">

                            {period.maximum_travel_time_minutes !==
                            null

                              ? `${period.maximum_travel_time_minutes.toFixed(
                                  2
                                )} min`

                              : "—"}

                          </td>


                          <td className="py-4">

                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                period.baseline_available
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-slate-50 text-slate-400"
                              }`}
                            >

                              {period.baseline_available
                                ? "Available"
                                : "Not Enough Data"}

                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* ==================================================
              CORRIDOR MAP
              ================================================== */}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-lg font-semibold text-slate-900">

                Corridor Map

              </h2>


              <p className="text-sm text-slate-500 mt-1">

                Google road route between the selected
                corridor origin and destination.

              </p>

            </div>


            <div className="relative">

              <div

                ref={mapRef}

                className="w-full h-[450px]"

              />


              {mapLoading && (

                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">

                  <p className="text-slate-500">

                    Loading Google Maps...

                  </p>

                </div>

              )}

            </div>


            {selectedCorridorData && (

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-t border-slate-200">

                <div>

                  <p className="text-sm text-slate-500">

                    Origin

                  </p>


                  <p className="font-medium text-slate-900 mt-1">

                    {
                      selectedCorridorData
                        .origin
                    }

                  </p>

                </div>


                <div>

                  <p className="text-sm text-slate-500">

                    Destination

                  </p>


                  <p className="font-medium text-slate-900 mt-1">

                    {
                      selectedCorridorData
                        .destination
                    }

                  </p>

                </div>


                <div>

                  <p className="text-sm text-slate-500">

                    Corridor Distance

                  </p>


                  <p className="font-medium text-slate-900 mt-1">

                    {
                      selectedCorridorData
                        .distance_km
                        .toFixed(2)
                    }{" "}

                    km

                  </p>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              TRAVEL TIME + SPEED
              ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            <div className="bg-white border border-slate-200 rounded-xl p-6">

              <h2 className="text-lg font-semibold text-slate-900">

                Travel Time

              </h2>


              <div className="grid grid-cols-2 gap-6 mt-5">

                <Stat

                  label="Minimum"

                  value={`${analytics.minimum_travel_time_minutes.toFixed(
                    2
                  )} min`}

                />


                <Stat

                  label="Maximum"

                  value={`${analytics.maximum_travel_time_minutes.toFixed(
                    2
                  )} min`}

                />

              </div>

            </div>


            <div className="bg-white border border-slate-200 rounded-xl p-6">

              <h2 className="text-lg font-semibold text-slate-900">

                Speed

              </h2>


              <div className="grid grid-cols-3 gap-4 mt-5">

                <Stat

                  label="Minimum"

                  value={`${analytics.minimum_speed_kmh.toFixed(
                    1
                  )} km/h`}

                />


                <Stat

                  label="Average"

                  value={`${analytics.average_speed_kmh.toFixed(
                    1
                  )} km/h`}

                />


                <Stat

                  label="Maximum"

                  value={`${analytics.maximum_speed_kmh.toFixed(
                    1
                  )} km/h`}

                />

              </div>

            </div>

          </div>
          
          {/* ==================================================
              CURRENT VS HISTORICAL PERIOD
              ================================================== */}

          {periodComparison && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Current vs Historical
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Compare the latest traffic condition with the
                    historical average for the same time period.
                  </p>
                </div>

                {periodComparison.current_period && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Current Period
                    </p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {periodComparison.current_period}
                    </p>
                  </div>
                )}

              </div>


              {!periodComparison.baseline_available ? (

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-5">

                  <p className="font-medium text-slate-800">
                    Historical comparison is not available yet.
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    {periodComparison.message ??
                      "More historical observations are required for this time period."}
                  </p>

                  {periodComparison.current && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                      <BaselineMetric
                        title="Current Travel Time"
                        value={`${periodComparison.current.travel_time_minutes.toFixed(
                          2
                        )} min`}
                      />

                      <BaselineMetric
                        title="Current Speed"
                        value={`${periodComparison.current.average_speed_kmh.toFixed(
                          1
                        )} km/h`}
                      />

                      <BaselineMetric
                        title="Current Condition"
                        value={
                          periodComparison.current
                            .traffic_condition
                        }
                      />

                    </div>
                  )}

                </div>

              ) : (

                <>

                  {/* ------------------------------------------------
                      STATUS
                      ------------------------------------------------ */}

                  <div className="mb-6">

                    <div className="flex flex-wrap items-center gap-3">

                      <span className="text-sm font-medium text-slate-600">
                        Traffic Status
                      </span>

                      <ComparisonStatusBadge
                        status={
                          periodComparison
                            .comparison
                            ?.status ?? "Unknown"
                        }
                      />

                      {periodComparison.congestion && (
                        <ConditionBadge
                          condition={
                            periodComparison
                              .congestion
                              .level
                          }
                        />
                      )}

                    </div>

                    {periodComparison.congestion?.description && (
                      <p className="text-sm text-slate-500 mt-3">
                        {periodComparison.congestion.description}
                      </p>
                    )}

                  </div>


                  {/* ------------------------------------------------
                      TRAVEL TIME COMPARISON
                      ------------------------------------------------ */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                    <BaselineMetric
                      title="Current Travel Time"
                      value={`${periodComparison.current?.travel_time_minutes.toFixed(
                        2
                      )} min`}
                    />

                    <BaselineMetric
                      title="Historical Normal"
                      value={`${periodComparison.historical_baseline?.average_travel_time_minutes.toFixed(
                        2
                      )} min`}
                    />

                    <BaselineMetric
                      title="Travel Time Difference"
                      value={`${
                        formatSignedNumber(
                          periodComparison
                            .comparison
                            ?.travel_time_difference_minutes ?? 0,
                          2
                        )
                      } min`}
                    />

                  </div>


                  {/* ------------------------------------------------
                      SPEED COMPARISON
                      ------------------------------------------------ */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <BaselineMetric
                      title="Current Speed"
                      value={`${periodComparison.current?.average_speed_kmh.toFixed(
                        1
                      )} km/h`}
                    />

                    <BaselineMetric
                      title="Historical Normal Speed"
                      value={`${periodComparison.historical_baseline?.average_speed_kmh.toFixed(
                        1
                      )} km/h`}
                    />

                    <BaselineMetric
                      title="Speed Difference"
                      value={`${
                        formatSignedNumber(
                          periodComparison
                            .comparison
                            ?.speed_difference_kmh ?? 0,
                          1
                        )
                      } km/h`}
                    />

                  </div>


                  {/* ------------------------------------------------
                      PERCENTAGE CHANGES
                      ------------------------------------------------ */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">

                      <p className="text-sm text-slate-500">
                        Delay Compared with Normal
                      </p>

                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {formatSignedPercentage(
                          periodComparison
                            .comparison
                            ?.delay_percentage ?? 0
                        )}
                      </p>

                      <p className="text-xs text-slate-400 mt-2">
                        Positive values indicate longer travel time.
                      </p>

                    </div>


                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">

                      <p className="text-sm text-slate-500">
                        Speed Change
                      </p>

                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {formatSignedPercentage(
                          periodComparison
                            .comparison
                            ?.speed_change_percentage ?? 0
                        )}
                      </p>

                      <p className="text-xs text-slate-400 mt-2">
                        Negative values indicate lower speed than normal.
                      </p>

                    </div>

                  </div>


                  {/* ------------------------------------------------
                      OBSERVATION INFORMATION
                      ------------------------------------------------ */}

                  <div className="mt-5 pt-4 border-t border-slate-100">

                    <p className="text-xs text-slate-400">
                      Historical observations used:
                      {" "}
                      {periodComparison
                        .historical_baseline
                        ?.observation_count ?? 0}
                    </p>

                  </div>

                </>

              )}

            </div>
          )}


          {/* ==================================================
              LAST 24 HOURS SUMMARY
              ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            <MetricCard

              title="24-Hour Observations"

              value={
                recentAnalysis
                  ? recentAnalysis
                      .observation_count
                      .toString()
                  : "—"
              }

              description="Records collected in the last 24 hours"

            />


            <MetricCard

              title="24-Hour Avg Travel Time"

              value={
                recentAnalysis?.average_travel_time_minutes !=
                null &&
                recentAnalysis?.average_travel_time_minutes !==
                  undefined

                  ? `${recentAnalysis.average_travel_time_minutes.toFixed(
                      2
                    )} min`

                  : "—"
              }

              description="Average over the last 24 hours"

            />


            <MetricCard

              title="24-Hour Avg Speed"

              value={
                recentAnalysis?.average_speed_kmh !=
                null &&
                recentAnalysis?.average_speed_kmh !==
                  undefined

                  ? `${recentAnalysis.average_speed_kmh.toFixed(
                      2
                    )} km/h`

                  : "—"
              }

              description="Average over the last 24 hours"

            />

          </div>


          {/* ==================================================
              15-MINUTE TRAVEL TIME TREND
              ================================================== */}

          <ChartCard

            title="Travel Time Trend"

            description="Average travel time in 15-minute intervals."

            hasData={
              fifteenMinuteData.length >
              0
            }

          >

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={
                  fifteenMinuteData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="period"
                />


                <YAxis
                  unit=" min"
                />


                <Tooltip />


                <Legend />


                <Line

                  type="monotone"

                  dataKey={
                    "average_travel_time_minutes"
                  }

                  name="Travel Time"

                  strokeWidth={3}

                  dot={{ r: 4 }}

                />

              </LineChart>

            </ResponsiveContainer>

          </ChartCard>


          {/* ==================================================
              15-MINUTE SPEED TREND
              ================================================== */}

          <ChartCard

            title="Speed Trend"

            description="Average speed in 15-minute intervals."

            hasData={
              fifteenMinuteData.length >
              0
            }

          >

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <LineChart
                data={
                  fifteenMinuteData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="period"
                />


                <YAxis
                  unit=" km/h"
                />


                <Tooltip />


                <Legend />


                <Line

                  type="monotone"

                  dataKey={
                    "average_speed_kmh"
                  }

                  name="Average Speed"

                  strokeWidth={3}

                  dot={{ r: 4 }}

                />

              </LineChart>

            </ResponsiveContainer>

          </ChartCard>


          {/* ==================================================
              LAST 24 HOURS
              ================================================== */}

          <ChartCard

            title="Last 24 Hours"

            description="Traffic observations collected during the last 24 hours."

            hasData={
              recentChartData.length >
              0
            }

          >

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={
                  recentChartData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="time"
                />


                <YAxis
                  unit=" min"
                />


                <Tooltip />


                <Legend />


                <Line

                  type="monotone"

                  dataKey="travelTime"

                  name="Travel Time"

                  strokeWidth={3}

                  dot={{ r: 3 }}

                />

              </LineChart>

            </ResponsiveContainer>

          </ChartCard>


          {/* ==================================================
              HOURLY TRAFFIC
              ================================================== */}

          <ChartCard

            title="Hourly Traffic Analysis"

            description="Compare average traffic conditions throughout the day."

            hasData={
              hourlyChartData.length >
              0
            }

          >

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <BarChart
                data={
                  hourlyChartData
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />


                <XAxis
                  dataKey="hour"
                />


                <YAxis />


                <Tooltip />


                <Legend />


                <Bar

                  dataKey="travelTime"

                  name="Travel Time (min)"

                />

              </BarChart>

            </ResponsiveContainer>

          </ChartCard>


          {/* ==================================================
              TRAFFIC DISTRIBUTION
              ================================================== */}

          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

            <h2 className="text-lg font-semibold text-slate-900">

              Traffic Condition Distribution

            </h2>


            <div className="mt-5 space-y-4">

              {Object.entries(
                analytics
                  .traffic_distribution
              ).map(
                (
                  [
                    condition,
                    count,
                  ]
                ) => {

                  const percentage =
                    analytics.observation_count >
                    0

                      ? (
                          count /
                          analytics.observation_count
                        ) *
                        100

                      : 0;


                  return (

                    <div
                      key={
                        condition
                      }
                    >

                      <div className="flex justify-between text-sm mb-1">

                        <span className="font-medium text-slate-700">

                          {condition}

                        </span>


                        <span className="text-slate-500">

                          {count} observations

                        </span>

                      </div>


                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">

                        <div

                          className="h-full bg-slate-800 rounded-full"

                          style={{
                            width:
                              `${percentage}%`,
                          }}

                        />

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </div>


          {/* ==================================================
              HOURLY DATA TABLE
              ================================================== */}

          {timeAnalysis &&
            timeAnalysis
              .hourly_analysis
              .length >
              0 && (

              <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

                <h2 className="text-lg font-semibold text-slate-900">

                  Hourly Data

                </h2>


                <div className="overflow-x-auto mt-5">

                  <table className="w-full text-sm">

                    <thead>

                      <tr className="border-b border-slate-200 text-left">

                        <th className="py-3 pr-4">
                          Date
                        </th>

                        <th className="py-3 pr-4">
                          Hour
                        </th>

                        <th className="py-3 pr-4">
                          Observations
                        </th>

                        <th className="py-3 pr-4">
                          Avg Travel Time
                        </th>

                        <th className="py-3 pr-4">
                          Avg Speed
                        </th>

                        <th className="py-3">
                          Condition
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {timeAnalysis
                        .hourly_analysis
                        .map(
                          (
                            item,
                            index
                          ) => (

                            <tr

                              key={`${item.date}-${item.hour}-${index}`}

                              className="border-b border-slate-100"

                            >

                              <td className="py-3 pr-4">

                                {item.date}

                              </td>


                              <td className="py-3 pr-4">

                                {formatHour(
                                  item.hour
                                )}

                              </td>


                              <td className="py-3 pr-4">

                                {
                                  item.observation_count
                                }

                              </td>


                              <td className="py-3 pr-4">

                                {item.average_travel_time_minutes.toFixed(
                                  2
                                )}{" "}

                                min

                              </td>


                              <td className="py-3 pr-4">

                                {item.average_speed_kmh.toFixed(
                                  2
                                )}{" "}

                                km/h

                              </td>


                              <td className="py-3">

                                <ConditionBadge

                                  condition={
                                    item.dominant_condition
                                  }

                                />

                              </td>

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}


          {/* ==================================================
              PEAK ANALYSIS
              ================================================== */}

          {timeAnalysis && (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <PeakCard

                title="Morning Peak"

                subtitle="07:00 – 10:00"

                data={
                  timeAnalysis
                    .peak_analysis
                    .morning_peak
                }

              />


              <PeakCard

                title="Evening Peak"

                subtitle="16:00 – 19:00"

                data={
                  timeAnalysis
                    .peak_analysis
                    .evening_peak
                }

              />

            </div>

          )}

        </>

      )}

    </div>

  );

}


// ============================================================
// 15-MINUTE AGGREGATION
// ============================================================

function createFifteenMinuteData(
  observations: TrendObservation[]
): FifteenMinuteData[] {

  const periods: Record<
    string,
    {
      timestamp: string;

      travelTimes: number[];

      speeds: number[];

      conditions: string[];
    }
  > = {};


  for (
    const observation of observations
  ) {

    const date =
      new Date(
        observation.observed_at
      );


    const minutes =
      date.getMinutes();


    const roundedMinutes =
      Math.floor(
        minutes / 15
      ) * 15;


    date.setMinutes(
      roundedMinutes,
      0,
      0
    );


    const key =
      date.toISOString();


    if (!periods[key]) {

      periods[key] = {

        timestamp: key,

        travelTimes: [],

        speeds: [],

        conditions: [],

      };

    }


    periods[key]
      .travelTimes
      .push(
        observation
          .travel_time_minutes
      );


    periods[key]
      .speeds
      .push(
        observation
          .average_speed_kmh
      );


    periods[key]
      .conditions
      .push(
        observation
          .traffic_condition
      );

  }


  return Object.values(
    periods
  )

    .sort(
      (a, b) =>
        new Date(
          a.timestamp
        ).getTime() -
        new Date(
          b.timestamp
        ).getTime()
    )

    .map(
      (period) => {

        const conditionCounts:
          Record<
            string,
            number
          > = {};


        for (
          const condition of
          period.conditions
        ) {

          conditionCounts[
            condition
          ] =
            (
              conditionCounts[
                condition
              ] ?? 0
            ) + 1;

        }


        const dominantCondition =
          Object.entries(
            conditionCounts
          ).sort(
            ([, a], [, b]) =>
              b - a
          )[0]?.[0] ??
          "Unknown";


        return {

          period:
            formatDateTime(
              new Date(
                period.timestamp
              )
            ),

          timestamp:
            period.timestamp,

          observation_count:
            period
              .travelTimes
              .length,

          average_travel_time_minutes:
            round(
              average(
                period.travelTimes
              ),
              2
            ),

          average_speed_kmh:
            round(
              average(
                period.speeds
              ),
              2
            ),

          dominant_condition:
            dominantCondition,

        };

      }
    );

}


// ============================================================
// CHART CARD
// ============================================================

function ChartCard({
  title,
  description,
  hasData,
  children,
}: {
  title: string;

  description: string;

  hasData: boolean;

  children: React.ReactNode;
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">

      <div className="mb-6">

        <h2 className="text-lg font-semibold text-slate-900">

          {title}

        </h2>


        <p className="text-sm text-slate-500 mt-1">

          {description}

        </p>

      </div>


      {!hasData ? (

        <div className="h-72 flex items-center justify-center text-slate-500">

          Not enough data available yet.

        </div>

      ) : (

        children

      )}

    </div>

  );

}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;

  value: string;

  description: string;
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl p-6">

      <p className="text-sm text-slate-500">

        {title}

      </p>


      <p className="text-2xl font-bold text-slate-900 mt-2">

        {value}

      </p>


      <p className="text-xs text-slate-400 mt-2">

        {description}

      </p>

    </div>

  );

}


// ============================================================
// STAT
// ============================================================

function Stat({
  label,
  value,
}: {
  label: string;

  value: string;
}) {

  return (

    <div>

      <p className="text-sm text-slate-500">

        {label}

      </p>


      <p className="text-xl font-semibold text-slate-900 mt-1">

        {value}

      </p>

    </div>

  );

}


// ============================================================
// CONDITION BADGE
// ============================================================

function ConditionBadge({
  condition,
}: {
  condition: string;
}) {

  return (

    <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">

      {condition}

    </span>

  );

}

function TrafficAlertBanner({
  level,
  message,
}: {
  level: string;
  message: string;
}) {
  let className =
    "rounded-xl border p-4 ";

  if (level === "Critical") {
    className +=
      "bg-red-50 border-red-200 text-red-800";
  } else if (level === "Congested") {
    className +=
      "bg-orange-50 border-orange-200 text-orange-800";
  } else if (level === "Above Normal") {
    className +=
      "bg-yellow-50 border-yellow-200 text-yellow-800";
  } else {
    className +=
      "bg-green-50 border-green-200 text-green-800";
  }

  return (
    <div className={className}>

      <div className="flex items-center gap-3">

        <span className="font-semibold">
          {level === "Critical"
            ? "Critical Traffic"
            : level === "Congested"
            ? "Congested Traffic"
            : level === "Above Normal"
            ? "Above Normal Traffic"
            : "Normal Traffic"}
        </span>

      </div>

      <p className="text-sm mt-1">
        {message}
      </p>

    </div>
  );
}

// ============================================================
// COMPARISON STATUS BADGE
// ============================================================


function ComparisonStatusBadge({
  status,
}: {
  status: string;
}) {

  let className =
    "inline-flex px-3 py-1 rounded-full text-xs font-medium ";

  if (status === "Above Normal") {

    className +=
      "bg-red-100 text-red-700";

  } else if (status === "Below Normal") {

    className +=
      "bg-green-100 text-green-700";

  } else {

    className +=
      "bg-slate-100 text-slate-700";

  }

  return (
    <span className={className}>
      {status}
    </span>
  );
}

// ============================================================
// BASELINE METRIC
// ============================================================

function BaselineMetric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-slate-900 mt-2">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// PEAK CARD
// ============================================================

function PeakCard({
  title,
  subtitle,
  data,
}: {
  title: string;

  subtitle: string;

  data: PeakSummary | null;
}) {

  return (

    <div className="bg-white border border-slate-200 rounded-xl p-6">

      <h2 className="text-lg font-semibold text-slate-900">

        {title}

      </h2>


      <p className="text-sm text-slate-500 mt-1">

        {subtitle}

      </p>


      {!data ? (

        <p className="text-sm text-slate-500 mt-6">

          Not enough data available for this
          period.

        </p>

      ) : (

        <div className="mt-6 space-y-5">

          <Stat

            label="Average Travel Time"

            value={`${data.average_travel_time_minutes.toFixed(
              2
            )} min`}

          />


          <Stat

            label="Average Speed"

            value={`${data.average_speed_kmh.toFixed(
              2
            )} km/h`}

          />


          <div className="pt-4 border-t border-slate-100">

            <p className="text-sm text-slate-500">

              Worst Hour

            </p>


            <p className="text-lg font-semibold text-slate-900 mt-1">

              {data.worst_hour.date}{" "}

              {formatHour(
                data.worst_hour.hour
              )}

            </p>


            <p className="text-sm text-slate-500 mt-1">

              {data.worst_hour.average_travel_time_minutes.toFixed(
                2
              )}{" "}

              min

              {" · "}

              {data.worst_hour.average_speed_kmh.toFixed(
                2
              )}{" "}

              km/h

            </p>


            <div className="mt-2">

              <ConditionBadge

                condition={
                  data.worst_hour.condition
                }

              />

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


// ============================================================
// HELPERS
// ============================================================

function average(
  values: number[]
) {

  if (
    values.length === 0
  ) {

    return 0;

  }


  return (

    values.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    ) / values.length

  );

}


function round(
  value: number,
  decimals: number
) {

  const multiplier =
    Math.pow(
      10,
      decimals
    );


  return (

    Math.round(
      value *
        multiplier
    ) / multiplier

  );

}

function formatSignedNumber(
  value: number,
  decimals: number
) {

  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${value.toFixed(
    decimals
  )}`;
}


function formatSignedPercentage(
  value: number
) {

  const prefix =
    value > 0
      ? "+"
      : "";

  return `${prefix}${value.toFixed(
    1
  )}%`;
}


function formatDateTime(
  date: Date
) {

  return date.toLocaleString(
    [],
    {

      month: "short",

      day: "numeric",

      hour: "2-digit",

      minute: "2-digit",

    }
  );

}


function formatHour(
  hour: number
) {

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";


  const displayHour =
    hour % 12 === 0
      ? 12
      : hour % 12;


  return `${displayHour}:00 ${suffix}`;

}

function getPerformanceMessage(
  data: PeriodComparisonResponse
) {
  const delay =
    data.comparison?.delay_percentage ?? 0;

  const period =
    data.current_period ?? "current period";

  if (delay > 10) {
    return `Traffic is currently above the historical normal for the ${period} period. Travel time is approximately ${delay.toFixed(
      1
    )}% higher than the historical baseline.`;
  }

  if (delay < -10) {
    return `Traffic is currently below the historical normal for the ${period} period. Travel time is approximately ${Math.abs(
      delay
    ).toFixed(
      1
    )}% lower than the historical baseline.`;
  }

  return `Traffic is currently within the normal historical range for the ${period} period.`;
}