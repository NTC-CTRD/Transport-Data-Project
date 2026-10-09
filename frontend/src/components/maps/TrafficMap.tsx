import { useEffect, useRef, useState } from "react";
import { importLibrary } from "../../services/googleMaps";


// ============================================================
// TYPES
// ============================================================

interface TrafficStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
}

interface TrafficItem {
  corridor_id: number;
  corridor_name: string;

  origin: string;
  origin_latitude: number;
  origin_longitude: number;

  destination: string;
  destination_latitude: number;
  destination_longitude: number;

  stops: TrafficStop[];

  distance_km: number;
  travel_time_minutes: number;
  average_speed_kmh: number;

  traffic_condition: string;

  observed_at: string;

  data_source: string;
}

interface SegmentTrafficObservation {
  id: number;
  corridor_id: number;

  from_stop_id: number;
  to_stop_id: number;

  sequence_order: number;

  observed_at: string;

  distance_km: number;
  travel_time_minutes: number;
  average_speed_kmh: number;

  traffic_condition: string;

  traffic_duration_seconds: number;
  static_duration_seconds: number;

  data_source: string;
  created_at: string;

  from_stop_name: string;
  to_stop_name: string;
}

interface TrafficMapProps {
  traffic: TrafficItem[];

  segmentTraffic?: SegmentTrafficObservation[];

  onSelect?: (
    traffic: TrafficItem
  ) => void;
}


// ============================================================
// COMPONENT
// ============================================================

export default function TrafficMap({
  traffic,
  segmentTraffic = [],
}: TrafficMapProps) {

  const mapRef =
    useRef<HTMLDivElement | null>(null);

  const mapInstance =
    useRef<google.maps.Map | null>(null);

  const directionsService =
    useRef<
      google.maps.DirectionsService | null
    >(null);

  const routePolylines =
    useRef<
      google.maps.Polyline[]
    >([]);

  const stopMarkers =
    useRef<
      google.maps.Marker[]
    >([]);

  const [mapReady, setMapReady] =
    useState(false);


  // ==========================================================
  // LOAD GOOGLE MAP
  // ==========================================================

  useEffect(() => {

    let mounted = true;

    const loadMap = async () => {

      try {

        // ----------------------------------------------------
        // Load Maps library
        // ----------------------------------------------------

        const { Map } =
          (await importLibrary(
            "maps"
          )) as google.maps.MapsLibrary;


        // ----------------------------------------------------
        // Load Routes library
        // ----------------------------------------------------

        const {
          DirectionsService,
        } =
          (await importLibrary(
            "routes"
          )) as google.maps.RoutesLibrary;


        if (
          !mapRef.current ||
          !mounted
        ) {
          return;
        }


        // ----------------------------------------------------
        // Create map
        // ----------------------------------------------------

        mapInstance.current =
          new Map(
            mapRef.current,
            {
              center: {
                lat: 6.875,
                lng: 79.86,
              },

              zoom: 12,

              mapTypeControl:
                true,

              streetViewControl:
                false,

              fullscreenControl:
                true,
            }
          );


        // ----------------------------------------------------
        // Create Directions Service
        // ----------------------------------------------------

        directionsService.current =
          new DirectionsService();


        setMapReady(true);

      } catch (error) {

        console.error(
          "Google Maps loading error:",
          error
        );

      }

    };


    loadMap();


    return () => {

      mounted = false;

    };

  }, []);


  // ==========================================================
  // DRAW TRAFFIC CORRIDORS
  // ==========================================================

  useEffect(() => {

    if (
      !mapReady ||
      !mapInstance.current ||
      !directionsService.current
    ) {
      return;
    }


    const map =
      mapInstance.current;

    const service =
      directionsService.current;


    // --------------------------------------------------------
    // REMOVE PREVIOUS ROUTES
    // --------------------------------------------------------

    routePolylines.current.forEach(
      (polyline) => {
        polyline.setMap(null);
      }
    );

    routePolylines.current = [];


    // --------------------------------------------------------
    // REMOVE PREVIOUS STOP MARKERS
    // --------------------------------------------------------

    stopMarkers.current.forEach(
      (marker) => {
        marker.setMap(null);
      }
    );

    stopMarkers.current = [];


    // --------------------------------------------------------
    // DRAW ROUTES
    // --------------------------------------------------------

    const drawRoutes = async () => {

      let firstRouteBounds:
        google.maps.LatLngBounds | null =
        null;


      for (
        const item of traffic
      ) {

        try {

          // ==================================================
          // SORT STOPS
          // ==================================================

          const orderedStops =
            [...(item.stops ?? [])].sort(
              (a, b) =>
                a.sequence_order -
                b.sequence_order
            );


          if (
            orderedStops.length < 2
          ) {
            continue;
          }


          // ==================================================
          // ORIGIN
          // ==================================================

          const originStop =
            orderedStops[0];

          const origin = {
            lat:
              originStop.latitude,

            lng:
              originStop.longitude,
          };


          // ==================================================
          // DESTINATION
          // ==================================================

          const destinationStop =
            orderedStops[
              orderedStops.length - 1
            ];

          const destination = {
            lat:
              destinationStop.latitude,

            lng:
              destinationStop.longitude,
          };


          // ==================================================
          // INTERMEDIATE WAYPOINTS
          // ==================================================

          const waypoints =
            orderedStops
              .slice(1, -1)
              .map(
                (stop) => ({
                  location: {
                    lat:
                      stop.latitude,

                    lng:
                      stop.longitude,
                  },

                  stopover:
                    true,
                })
              );


          // ==================================================
          // GOOGLE ROUTE
          // ==================================================

          const result =
            await service.route({

              origin,

              destination,

              waypoints,

              optimizeWaypoints:
                false,

              travelMode:
                google.maps.TravelMode.DRIVING,

            });


          if (
            !result.routes ||
            result.routes.length === 0
          ) {

            console.error(
              `No route found for corridor ${item.corridor_id}`
            );

            continue;

          }


          const route =
            result.routes[0];


          // ==================================================
          // ROUTE BOUNDS
          // ==================================================

          const bounds =
            new google.maps.LatLngBounds();


          // ==================================================
          // DRAW EACH SEGMENT
          // ==================================================

          route.legs.forEach(
            (
              leg,
              legIndex
            ) => {


              // TEMPORARY FIVE-COLOUR TEST
              const segment =
                segmentTraffic.find(
                  (observation) =>
                    observation.corridor_id === item.corridor_id &&
                    observation.sequence_order === legIndex + 1
                );

              const trafficCondition =
                segment?.traffic_condition ?? item.traffic_condition;

              const strokeColor =
                getTrafficColor(trafficCondition);


              const legPath: google.maps.LatLng[] = [];

              leg.steps.forEach((step) => {
                step.path.forEach((point) => {
                  legPath.push(point);
                });
              });

              const polyline = new google.maps.Polyline({
                path: legPath,
                geodesic: true,
                strokeColor,
                strokeOpacity: 0.9,
                strokeWeight: 7,
                map,
              });


              routePolylines.current.push(
                polyline
              );


              // ------------------------------------------------
              // Extend bounds
              // ------------------------------------------------

              leg.steps.forEach((step) => {
                step.path.forEach((point: google.maps.LatLng) => {
                  bounds.extend(point);
                });
              });

            }
          );


          // ==================================================
          // STOP MARKERS
          // ==================================================

          orderedStops.forEach(
            (
              stop,
              index
            ) => {

              const marker =
                new google.maps.Marker({

                  map,

                  position: {
                    lat:
                      stop.latitude,

                    lng:
                      stop.longitude,
                  },

                  title:
                    `${index + 1}. ${stop.name}`,

                  label:
                    `${index + 1}`,

                });


              stopMarkers.current.push(
                marker
              );


              bounds.extend({
                lat:
                  stop.latitude,

                lng:
                  stop.longitude,
              });

            }
          );


          // ==================================================
          // FIRST CORRIDOR BOUNDS
          // ==================================================

          if (
            !firstRouteBounds
          ) {

            firstRouteBounds =
              bounds;

          }


        } catch (error) {

          console.error(
            `Failed to draw corridor ${item.corridor_id}:`,
            error
          );

        }

      }


      // ========================================================
      // FIT MAP TO FIRST CORRIDOR
      // ========================================================

      if (
        firstRouteBounds &&
        !firstRouteBounds.isEmpty()
      ) {

        map.fitBounds(
          firstRouteBounds
        );

      }

    };


    drawRoutes();

  }, [
    traffic,
    segmentTraffic,
    mapReady,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="relative"
    >

      {/* ====================================================
          MAP
          ==================================================== */}

      <div
        ref={
          mapRef
        }

        className="w-full h-[500px] rounded-2xl overflow-hidden border border-slate-200"
      />


      {/* ====================================================
          MAP LEGEND
          ==================================================== */}

      <div className="absolute bottom-5 left-5 bg-white rounded-xl shadow-lg border border-slate-200 p-4">

        <p className="font-semibold text-sm mb-3">
          Traffic Condition
        </p>


        <div className="space-y-2 text-sm">

          <LegendItem
            color="#16a34a"
            text="Free Flow"
          />

          <LegendItem
            color="#2563eb"
            text="Light"
          />

          <LegendItem
            color="#ca8a04"
            text="Moderate"
          />

          <LegendItem
            color="#ea580c"
            text="Heavy"
          />

          <LegendItem
            color="#dc2626"
            text="Severe"
          />

        </div>

      </div>


      {/* ====================================================
          MAP INFO
          ==================================================== */}

      <div className="absolute top-5 right-5 bg-white rounded-xl shadow-lg border border-slate-200 px-4 py-3">

        <p className="text-xs text-slate-500">
          Active Corridors
        </p>

        <p className="text-xl font-bold">
          {traffic.length}
        </p>

      </div>

    </div>

  );

}


// ============================================================
// TRAFFIC COLOR
// ============================================================

function getTrafficColor(
  condition: string
) {

  switch (
    condition.toLowerCase()
  ) {

    case "free flow":
      return "#16a34a";

    case "light":
      return "#2563eb";

    case "moderate":
      return "#ca8a04";

    case "heavy":
      return "#ea580c";

    case "severe":
      return "#dc2626";

    default:
      return "#64748b";

  }

}


// ============================================================
// LEGEND ITEM
// ============================================================

function LegendItem({
  color,
  text,
}: {
  color: string;
  text: string;
}) {

  return (

    <div className="flex items-center gap-2">

      <span
        className="w-3 h-3 rounded-full"

        style={{
          backgroundColor:
            color,
        }}
      />

      <span>
        {text}
      </span>

    </div>

  );

}