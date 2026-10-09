import { useEffect, useState } from "react";

import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import TrafficMap from "../components/maps/TrafficMap";
import {
  getLatestSegmentObservations,
} from "../services/observationService";

import type {
  SegmentTrafficObservation,
} from "../services/observationService";


const API_URL = "http://127.0.0.1:8000";


interface Corridor {
  id: number;
  project_id: number;
  name: string;
  origin: string;
  origin_latitude: number;
  origin_longitude: number;
  destination: string;
  destination_latitude: number;
  destination_longitude: number;
  distance_km: number;
  status: string;
}


interface LatestTraffic {
  corridor_id: number;
  corridor_name: string;

  origin: string;
  origin_latitude: number;
  origin_longitude: number;

  destination: string;
  destination_latitude: number;
  destination_longitude: number;
  
  stops: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    sequence_order: number;
  }[];


  distance_km: number;
  travel_time_minutes: number;
  average_speed_kmh: number;

  traffic_condition: string;

  observed_at: string;

  data_source: string;
}


export default function Dashboard() {

  const [showModal, setShowModal] =
    useState(false);


  const [corridors, setCorridors] =
    useState<Corridor[]>([]);


  const [corridor, setCorridor] =
    useState<Corridor | null>(null);


  const [latestTraffic, setLatestTraffic] =
    useState<LatestTraffic[]>([]);


  const [selectedTraffic, setSelectedTraffic] =
    useState<LatestTraffic | null>(null);

  const [segmentTraffic, setSegmentTraffic] =
    useState<SegmentTrafficObservation[]>([]);

  const [segmentLoading, setSegmentLoading] =
    useState(false);


  const [loading, setLoading] =
    useState(false);


  const [dashboardLoading, setDashboardLoading] =
    useState(true);


  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);


  const [form, setForm] = useState({
    studyName: "",
    origin: "",
    originLatitude: "",
    originLongitude: "",
    destination: "",
    destinationLatitude: "",
    destinationLongitude: "",
    distanceKm: "",
  });


  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {

    loadDashboardData();

  }, []);


  const loadDashboardData = async () => {

    try {

      setDashboardLoading(true);

      const token =
        localStorage.getItem(
          "access_token"
        );


      const headers = {
        Authorization: `Bearer ${token}`,
      };


      // --------------------------------------------------------
      // Get corridors
      // --------------------------------------------------------

      const corridorResponse =
        await fetch(
          `${API_URL}/corridors`,
          {
            headers,
          }
        );


      if (!corridorResponse.ok) {

        throw new Error(
          "Failed to load corridors"
        );

      }


      const corridorData:
        Corridor[] =
        await corridorResponse.json();


      setCorridors(
        corridorData
      );


      if (corridorData.length > 0) {

        setCorridor(
          corridorData[
            corridorData.length - 1
          ]
        );

      }


      // --------------------------------------------------------
      // Get latest traffic
      // --------------------------------------------------------

      const trafficResponse =
        await fetch(
          `${API_URL}/observations/latest/active`,
          {
            headers,
          }
        );


      if (!trafficResponse.ok) {

        throw new Error(
          "Failed to load latest traffic"
        );

      }


      const trafficData:
        LatestTraffic[] =
        await trafficResponse.json();


      setLatestTraffic(
        trafficData
      );


      // --------------------------------------------------------
      // Select first traffic record
      // --------------------------------------------------------

      if (trafficData.length > 0) {

        setSelectedTraffic(
          trafficData[0]
        );

        await loadSegmentTraffic(
          trafficData[0].corridor_id
        );

      }


      setLastUpdated(
        new Date()
      );


    } catch (error) {

      console.error(
        "Dashboard loading error:",
        error
      );

    } finally {

      setDashboardLoading(false);

    }

  };

  const loadSegmentTraffic = async (
  corridorId: number
) => {
  try {
    setSegmentLoading(true);

    const data =
      await getLatestSegmentObservations(
        corridorId
      );

    setSegmentTraffic(data);
  } catch (error) {
    console.error(
      "Segment traffic loading error:",
      error
    );

    setSegmentTraffic([]);
  } finally {
    setSegmentLoading(false);
  }
};


  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const {
      name,
      value,
    } = event.target;


    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // ============================================================
  // CREATE STUDY
  // ============================================================

  const createStudy = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();

    setLoading(true);


    try {

      const token =
        localStorage.getItem(
          "access_token"
        );


      const response =
        await fetch(
          `${API_URL}/corridors`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              project_id: 1,

              name:
                form.studyName,

              origin:
                form.origin,

              origin_latitude:
                Number(
                  form.originLatitude
                ),

              origin_longitude:
                Number(
                  form.originLongitude
                ),

              destination:
                form.destination,

              destination_latitude:
                Number(
                  form.destinationLatitude
                ),

              destination_longitude:
                Number(
                  form.destinationLongitude
                ),

              distance_km:
                Number(
                  form.distanceKm
                ),

            }),
          }
        );


      if (!response.ok) {

        const error =
          await response.text();

        throw new Error(error);

      }


      const newCorridor =
        await response.json();


      setCorridor(
        newCorridor
      );


      setCorridors(
        (previous) => [
          ...previous,
          newCorridor,
        ]
      );


      setForm({

        studyName: "",
        origin: "",
        originLatitude: "",
        originLongitude: "",
        destination: "",
        destinationLatitude: "",
        destinationLongitude: "",
        distanceKm: "",

      });


      setShowModal(false);


      alert(
        "Traffic study created successfully!"
      );


      await loadDashboardData();


    } catch (error) {

      console.error(error);

      alert(
        "Failed to create traffic study."
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // SUMMARY VALUES
  // ============================================================

  const activeCorridors =
    corridors.filter(
      (item) =>
        item.status === "Active"
    ).length;


  const totalObservations =
    latestTraffic.length;


  const averageSpeed =
    latestTraffic.length > 0

      ? latestTraffic.reduce(
          (
            total,
            item
          ) =>
            total +
            item.average_speed_kmh,
          0
        ) /
        latestTraffic.length

      : 0;


  const congestedCorridors =
    latestTraffic.filter(
      (item) =>
        item.traffic_condition ===
          "Heavy" ||
        item.traffic_condition ===
          "Severe"
    ).length;


  // ============================================================
  // CONDITION CLASS
  // ============================================================

  const getConditionClass = (
    condition: string
  ) => {

    switch (
      condition.toLowerCase()
    ) {

      case "free flow":
        return "bg-green-100 text-green-700";

      case "light":
        return "bg-blue-100 text-blue-700";

      case "moderate":
        return "bg-yellow-100 text-yellow-700";

      case "heavy":
        return "bg-orange-100 text-orange-700";

      case "severe":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";

    }

  };


  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatObservedTime = (
    value: string
  ) => {

    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "Unknown";

    }


    return date.toLocaleString(
      [],
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );

  };


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="space-y-8">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <PageHeader

        title="Traffic Intelligence Dashboard"

        subtitle="Real-time and historical traffic monitoring powered by automatically collected Google traffic data."

      />


      {/* ======================================================
          REFRESH
          ====================================================== */}

      <div className="flex justify-end">

        <Button
          onClick={
            loadDashboardData
          }
        >

          {dashboardLoading
            ? "Loading..."
            : "Refresh Traffic"}

        </Button>

      </div>


      {/* ======================================================
          STATISTICS
          ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <StatCard
          title="Active Corridors"
          value={
            activeCorridors.toString()
          }
        />

        <StatCard
          title="Latest Observations"
          value={
            totalObservations.toString()
          }
        />

        <StatCard
          title="Average Speed"
          value={
            averageSpeed > 0
              ? `${averageSpeed.toFixed(
                  1
                )} km/h`
              : "—"
          }
        />

        <StatCard
          title="Heavy / Severe"
          value={
            congestedCorridors.toString()
          }
        />

      </div>


      {/* ======================================================
          LIVE TRAFFIC MAP
          ====================================================== */}

      <Card>

        <div className="mb-5">

          <h2 className="text-xl font-semibold">
            Live Traffic Map
          </h2>

          <p className="text-slate-500 mt-1">
            Current traffic conditions across
            active monitored corridors.
          </p>

        </div>


        {dashboardLoading ? (

          <div className="h-[500px] flex items-center justify-center">

            <p className="text-slate-500">
              Loading traffic map...
            </p>

          </div>

        ) : latestTraffic.length === 0 ? (

          <div className="h-[500px] flex items-center justify-center">

            <p className="text-slate-500">
              No active traffic observations available.
            </p>

          </div>

        ) : (

          <TrafficMap
            traffic={latestTraffic}
            segmentTraffic={segmentTraffic}
            onSelect={
              setSelectedTraffic
            }
          />

        )}

      </Card>


      {/* ======================================================
          CURRENT TRAFFIC
          ====================================================== */}

      <Card>

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="text-xl font-semibold">

              Current Traffic Conditions

            </h2>

            <p className="text-slate-500 mt-1">

              Latest automatically collected observation
              for each active corridor.

            </p>

          </div>


          {lastUpdated && (

            <p className="text-sm text-slate-400">

              Dashboard updated{" "}

              {lastUpdated.toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}

            </p>

          )}

        </div>


        {dashboardLoading ? (

          <p className="text-slate-500">

            Loading traffic conditions...

          </p>

        ) : latestTraffic.length === 0 ? (

          <p className="text-slate-500">

            No traffic observations are available yet.

          </p>

        ) : (

          <div className="space-y-3">

            {latestTraffic.map(
              (traffic) => (

                <button

                  key={
                    traffic.corridor_id
                  }

                  type="button"

                  onClick={async () => {
                    setSelectedTraffic(
                      traffic
                    );

                    await loadSegmentTraffic(
                      traffic.corridor_id
                    );
                  }}

                  className={`w-full text-left border rounded-xl p-5 transition hover:border-slate-400 ${
                    selectedTraffic?.corridor_id ===
                    traffic.corridor_id
                      ? "border-slate-500 bg-slate-50"
                      : "border-slate-200"
                  }`}

                >

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">


                    <div>

                      <h3 className="font-semibold text-slate-900">

                        {traffic.corridor_name}

                      </h3>


                      <p className="text-sm text-slate-500 mt-1">

                        {traffic.origin}

                        {" → "}

                        {traffic.destination}

                      </p>

                    </div>


                    <div className="flex flex-wrap items-center gap-5">


                      <div>

                        <p className="text-xs text-slate-400">
                          Speed
                        </p>

                        <p className="font-semibold">

                          {traffic.average_speed_kmh.toFixed(
                            1
                          )}{" "}

                          km/h

                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-slate-400">
                          Travel Time
                        </p>

                        <p className="font-semibold">

                          {traffic.travel_time_minutes.toFixed(
                            1
                          )}{" "}

                          min

                        </p>

                      </div>


                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getConditionClass(
                          traffic.traffic_condition
                        )}`}
                      >

                        {traffic.traffic_condition}

                      </span>


                    </div>

                  </div>


                  <p className="text-xs text-slate-400 mt-3">

                    Updated:{" "}

                    {formatObservedTime(
                      traffic.observed_at
                    )}

                    {" · "}

                    {traffic.data_source}

                  </p>

                </button>

              )
            )}

          </div>

        )}

      </Card>


      {/* ======================================================
          SELECTED CORRIDOR
          ====================================================== */}

      {selectedTraffic && (

        <Card>

          <h2 className="text-xl font-semibold mb-5">

            Latest Analysis

          </h2>


          <div className="mb-6">

            <p className="text-slate-500">
              Corridor
            </p>

            <h3 className="text-lg font-semibold">

              {selectedTraffic.corridor_name}

            </h3>


            <p className="text-slate-500 text-sm mt-1">

              {selectedTraffic.origin}

              {" → "}

              {selectedTraffic.destination}

            </p>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">


            <div>

              <p className="text-slate-500">
                Distance
              </p>

              <h3 className="text-2xl font-bold">

                {selectedTraffic.distance_km.toFixed(
                  2
                )}{" "}

                km

              </h3>

            </div>


            <div>

              <p className="text-slate-500">
                Travel Time
              </p>

              <h3 className="text-2xl font-bold">

                {selectedTraffic.travel_time_minutes.toFixed(
                  1
                )}{" "}

                min

              </h3>

            </div>


            <div>

              <p className="text-slate-500">
                Traffic
              </p>

              <h3 className="text-2xl font-bold">

                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm ${getConditionClass(
                    selectedTraffic.traffic_condition
                  )}`}
                >

                  {selectedTraffic.traffic_condition}

                </span>

              </h3>

            </div>


            <div>

              <p className="text-slate-500">
                Average Speed
              </p>

              <h3 className="text-2xl font-bold">

                {selectedTraffic.average_speed_kmh.toFixed(
                  1
                )}{" "}

                km/h

              </h3>

            </div>


          </div>


          {/* ======================================================
              SEGMENT TRAFFIC
              ====================================================== */}

          <div className="mt-8">

            <div className="mb-4">

              <h3 className="text-lg font-semibold">
                Segment Traffic
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Latest traffic conditions for each
                stop-to-stop segment.
              </p>

            </div>


            {segmentLoading ? (

              <div className="py-8 text-center">

                <p className="text-slate-500">
                  Loading segment traffic...
                </p>

              </div>

            ) : segmentTraffic.length === 0 ? (

              <div className="py-8 text-center border border-slate-200 rounded-xl">

                <p className="text-slate-500">
                  No segment traffic data available.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {segmentTraffic
                  .sort(
                    (a, b) =>
                      a.sequence_order -
                      b.sequence_order
                  )
                  .map((segment) => (

                    <div
                      key={segment.id}
                      className="border border-slate-200 rounded-xl p-4"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>

                          <p className="text-xs text-slate-400">
                            Segment {segment.sequence_order}
                          </p>

                          <p className="font-semibold text-slate-900 mt-1">
                            {segment.from_stop_name}
                            {" → "}
                            {segment.to_stop_name}
                          </p>

                        </div>


                        <div className="flex flex-wrap items-center gap-5">

                          <div>

                            <p className="text-xs text-slate-400">
                              Distance
                            </p>

                            <p className="font-semibold">
                              {segment.distance_km.toFixed(2)} km
                            </p>

                          </div>


                          <div>

                            <p className="text-xs text-slate-400">
                              Travel Time
                            </p>

                            <p className="font-semibold">
                              {segment.travel_time_minutes.toFixed(1)} min
                            </p>

                          </div>


                          <div>

                            <p className="text-xs text-slate-400">
                              Speed
                            </p>

                            <p className="font-semibold">
                              {segment.average_speed_kmh.toFixed(1)} km/h
                            </p>

                          </div>


                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getConditionClass(
                              segment.traffic_condition
                            )}`}
                          >
                            {segment.traffic_condition}
                          </span>

                        </div>

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </Card>

      )}


      {/* ======================================================
          NEW STUDY
          ====================================================== */}

      <Card>

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-xl font-semibold">

              Start a New Traffic Study

            </h2>


            <p className="text-slate-500 mt-2">

              Create a corridor by selecting start and
              end locations for traffic monitoring.

            </p>

          </div>


          <Button
            onClick={() =>
              setShowModal(true)
            }
          >

            + New Study

          </Button>

        </div>

      </Card>


      {/* ======================================================
          CURRENT STUDY
          ====================================================== */}

      <Card>

        <h2 className="text-xl font-semibold mb-5">

          Current Study

        </h2>


        {corridor ? (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">


            <div>

              <p className="text-slate-500">
                Study Name
              </p>

              <p className="font-semibold">
                {corridor.name}
              </p>


              <div className="mt-5">

                <p className="text-slate-500">
                  Study Route
                </p>


                <p className="font-semibold mt-2">
                  📍 {corridor.origin}
                </p>


                <p className="text-center my-2 text-slate-400">
                  ↓
                </p>


                <p className="font-semibold">
                  📍 {corridor.destination}
                </p>

              </div>

            </div>


            <div>

              <p className="text-slate-500">
                Data Sources
              </p>


              <div className="mt-2 space-y-2">

                <div>
                  ✅ Google Routes API
                </div>

                <div>
                  ⬜ Excel Dataset
                </div>

                <div>
                  ⬜ CSV Dataset
                </div>

              </div>


              <div className="mt-5">

                <p className="text-slate-500">
                  Collection
                </p>

                <p className="font-semibold mt-1">
                  Automatic · Every 15 minutes
                </p>

              </div>

            </div>

          </div>

        ) : (

          <p className="text-slate-500">
            No traffic study has been created yet.
          </p>

        )}

      </Card>


      {/* ======================================================
          AI INSIGHT
          ====================================================== */}

      <Card>

        <h2 className="text-xl font-semibold mb-4">
          AI Recommendation
        </h2>


        <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

          <p className="text-slate-700 leading-7">

            Traffic intelligence recommendations will
            appear here after sufficient historical
            traffic data has been collected and analyzed.

          </p>

        </div>

      </Card>


      {/* ======================================================
          NEW STUDY MODAL
          ====================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">


            {/* Modal Header */}

            <div className="flex items-center justify-between p-6 border-b">

              <div>

                <h2 className="text-2xl font-bold">
                  Create New Traffic Study
                </h2>


                <p className="text-slate-500 mt-1">
                  Define the corridor you want to monitor.
                </p>

              </div>


              <button

                type="button"

                onClick={() =>
                  setShowModal(false)
                }

                className="text-slate-400 hover:text-slate-700 text-2xl"

              >

                ×

              </button>

            </div>


            {/* Form */}

            <form
              onSubmit={createStudy}
              className="p-6 space-y-6"
            >


              {/* Study Name */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Study Name
                </label>


                <input

                  type="text"

                  name="studyName"

                  value={
                    form.studyName
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Colombo Morning Peak Analysis"

                  required

                  className="w-full border border-slate-300 rounded-lg px-4 py-3"

                />

              </div>


              {/* Origin */}

              <div>

                <h3 className="font-semibold text-lg mb-3">
                  Start Location
                </h3>


                <input

                  type="text"

                  name="origin"

                  value={
                    form.origin
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Dehiwala Flyover"

                  required

                  className="w-full border border-slate-300 rounded-lg px-4 py-3"

                />


                <div className="grid grid-cols-2 gap-4 mt-3">

                  <input

                    type="number"

                    step="any"

                    name="originLatitude"

                    value={
                      form.originLatitude
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Latitude"

                    required

                    className="border border-slate-300 rounded-lg px-4 py-3"

                  />


                  <input

                    type="number"

                    step="any"

                    name="originLongitude"

                    value={
                      form.originLongitude
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Longitude"

                    required

                    className="border border-slate-300 rounded-lg px-4 py-3"

                  />

                </div>

              </div>


              {/* Destination */}

              <div>

                <h3 className="font-semibold text-lg mb-3">
                  End Location
                </h3>


                <input

                  type="text"

                  name="destination"

                  value={
                    form.destination
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="Marino Mall"

                  required

                  className="w-full border border-slate-300 rounded-lg px-4 py-3"

                />


                <div className="grid grid-cols-2 gap-4 mt-3">

                  <input

                    type="number"

                    step="any"

                    name="destinationLatitude"

                    value={
                      form.destinationLatitude
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Latitude"

                    required

                    className="border border-slate-300 rounded-lg px-4 py-3"

                  />


                  <input

                    type="number"

                    step="any"

                    name="destinationLongitude"

                    value={
                      form.destinationLongitude
                    }

                    onChange={
                      handleChange
                    }

                    placeholder="Longitude"

                    required

                    className="border border-slate-300 rounded-lg px-4 py-3"

                  />

                </div>

              </div>


              {/* Distance */}

              <div>

                <label className="block text-sm font-medium mb-2">
                  Distance (km)
                </label>


                <input

                  type="number"

                  step="any"

                  name="distanceKm"

                  value={
                    form.distanceKm
                  }

                  onChange={
                    handleChange
                  }

                  placeholder="6.26"

                  required

                  className="w-full border border-slate-300 rounded-lg px-4 py-3"

                />

              </div>


              {/* Data Sources */}

              <div>

                <h3 className="font-semibold text-lg mb-3">
                  Data Sources
                </h3>


                <div className="space-y-3">

                  <label className="flex items-center gap-3">

                    <input
                      type="checkbox"
                      defaultChecked
                    />

                    <span>
                      Google Routes API
                    </span>

                  </label>


                  <label className="flex items-center gap-3">

                    <input
                      type="checkbox"
                    />

                    <span>
                      Excel Dataset
                    </span>

                  </label>


                  <label className="flex items-center gap-3">

                    <input
                      type="checkbox"
                    />

                    <span>
                      CSV Dataset
                    </span>

                  </label>

                </div>

              </div>


              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-4 border-t">

                <button

                  type="button"

                  onClick={() =>
                    setShowModal(false)
                  }

                  className="px-5 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"

                >

                  Cancel

                </button>


                <button

                  type="submit"

                  disabled={loading}

                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

                >

                  {loading
                    ? "Creating..."
                    : "Create Study"}

                </button>

              </div>


            </form>

          </div>

        </div>

      )}

    </div>

  );
}     