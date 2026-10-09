import { importLibrary } from "./googleMaps";


interface RouteStop {
  latitude: number;
  longitude: number;
}


interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
}


export async function calculateRoute(
  stops: RouteStop[]
): Promise<RouteResult> {

  // ----------------------------------------------------------
  // Validate stops
  // ----------------------------------------------------------

  if (stops.length < 2) {
    throw new Error(
      "At least 2 stops are required to calculate a route."
    );
  }


  // ----------------------------------------------------------
  // Load Google Routes library
  // ----------------------------------------------------------

  const { Route } =
    (await importLibrary(
      "routes"
    )) as google.maps.RoutesLibrary;


  // ----------------------------------------------------------
  // First stop = origin
  // ----------------------------------------------------------

  const origin = {
    lat: stops[0].latitude,
    lng: stops[0].longitude,
  };


  // ----------------------------------------------------------
  // Last stop = destination
  // ----------------------------------------------------------

  const lastStop =
    stops[stops.length - 1];


  const destination = {
    lat: lastStop.latitude,
    lng: lastStop.longitude,
  };


  // ----------------------------------------------------------
  // Middle stops = intermediate waypoints
  //
  // Example:
  //
  // A → B → C → D → E
  //
  // origin      = A
  // intermediates = B, C, D
  // destination = E
  // ----------------------------------------------------------

  const intermediates =
    stops
      .slice(1, -1)
      .map((stop) => ({
        location: {
          lat: stop.latitude,
          lng: stop.longitude,
        },

        // Force the route through this location.
        via: true,
      }));


  // ----------------------------------------------------------
  // Google Routes request
  // ----------------------------------------------------------

  const request:
    google.maps.routes.ComputeRoutesRequest = {

    origin,

    destination,

    intermediates,

    travelMode:
      "DRIVING",

    // IMPORTANT:
    // Do NOT allow Google to reorder the stops.
    optimizeWaypointOrder:
      false,

    fields: [
      "distanceMeters",
      "durationMillis",
      "legs",
      "path",
    ],
  };


  // ----------------------------------------------------------
  // Calculate route
  // ----------------------------------------------------------

  const result =
    await Route.computeRoutes(
      request
    );


  if (
    !result.routes ||
    result.routes.length === 0
  ) {

    throw new Error(
      "No route found through all selected stops."
    );

  }


  const route =
    result.routes[0];


  // ----------------------------------------------------------
  // Return total route distance + duration
  // ----------------------------------------------------------

  return {

    distanceKm:
      Number(
        route.distanceMeters
      ) / 1000,

    durationMinutes:
      Number(
        route.durationMillis
      ) / 60000,

  };

}