import {
  useCallback,
  useEffect,
  useState,
} from "react";

import LocationPicker, {
  type SelectedLocation,
} from "../components/forms/LocationPicker";

import { calculateRoute } from "../services/routeService";

import CorridorMap from "../components/common/CorridorMap";


const API_URL = "http://127.0.0.1:8000";

const MIN_STOPS = 2;
const MAX_STOPS = 10;


// ============================================================
// TYPES
// ============================================================

interface CorridorStop {
  id?: number;

  name: string;

  latitude: number;

  longitude: number;

  sequence_order: number;
}


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

  stops?: CorridorStop[];
}


interface StopForm {
  name: string;

  latitude: string;

  longitude: string;
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function Corridors() {

  const [corridors, setCorridors] =
    useState<Corridor[]>([]);

  const [loading, setLoading] =
    useState(true);


  // ----------------------------------------------------------
  // Route calculation
  // ----------------------------------------------------------

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeDuration, setRouteDuration] =
    useState<number | null>(null);

  const [routeError, setRouteError] =
    useState("");


  // ----------------------------------------------------------
  // Corridor form
  // ----------------------------------------------------------

  const [form, setForm] = useState({
    project_id: 1,

    name: "",

    origin: "",

    origin_latitude: "",

    origin_longitude: "",

    destination: "",

    destination_latitude: "",

    destination_longitude: "",

    distance_km: "",
  });


  // ----------------------------------------------------------
  // Stops
  // Default = 2
  // Maximum = 5
  // ----------------------------------------------------------

  const [stops, setStops] =
    useState<StopForm[]>(
      createInitialStops()
    );


  // ==========================================================
  // GET CORRIDORS
  // ==========================================================

  const fetchCorridors = async () => {

    try {

      const token =
        localStorage.getItem(
          "access_token"
        );

      const response =
        await fetch(
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


      const data:
        Corridor[] =
        await response.json();


      setCorridors(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchCorridors();

  }, []);


  // ==========================================================
  // NORMAL INPUT CHANGES
  // ==========================================================

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


  // ==========================================================
  // UPDATE FORM FROM STOPS
  // ==========================================================

  const updateFormFromStops = useCallback(
    (
      updatedStops: StopForm[]
    ) => {

      if (
        updatedStops.length < 2
      ) {

        return;

      }


      const firstStop =
        updatedStops[0];

      const lastStop =
        updatedStops[
          updatedStops.length - 1
        ];


      setForm(
        (previous) => ({
          ...previous,

          origin:
            firstStop.name,

          origin_latitude:
            firstStop.latitude,

          origin_longitude:
            firstStop.longitude,

          destination:
            lastStop.name,

          destination_latitude:
            lastStop.latitude,

          destination_longitude:
            lastStop.longitude,
        })
      );

    },
    []
  );


  // ==========================================================
  // RECALCULATE ROUTE USING FIRST + LAST STOP
  // ==========================================================

  const recalculateRouteFromStops =
    useCallback(
      async (
        updatedStops: StopForm[]
      ) => {

        if (
          updatedStops.length < MIN_STOPS
        ) {
          return;
        }


        const validStops =
          updatedStops.filter(
            (stop) =>
              stop.latitude &&
              stop.longitude
          );


        if (
          validStops.length !==
          updatedStops.length
        ) {
          return;
        }


        try {

          setRouteLoading(true);

          setRouteError("");

          setRouteDuration(null);


          const routeStops =
            updatedStops.map(
              (stop) => ({
                latitude:
                  Number(
                    stop.latitude
                  ),

                longitude:
                  Number(
                    stop.longitude
                  ),
              })
            );


          const result =
            await calculateRoute(
              routeStops
            );


          setForm(
            (previous) => ({
              ...previous,

              distance_km:
                result.distanceKm.toFixed(
                  2
                ),
            })
          );


          setRouteDuration(
            result.durationMinutes
          );


        } catch (error) {

          console.error(
            "Route calculation failed:",
            error
          );


          setRouteError(
            "Unable to calculate a route through all selected stops."
          );


        } finally {

          setRouteLoading(false);

        }

      },
      []
  );


  // ==========================================================
  // STOP LOCATION SELECTION
  // ==========================================================

  const handleStopSelect = useCallback(
    (
      index: number,
      location: SelectedLocation
    ) => {

      setStops(
        (previous) => {

          const updated =
            [...previous];


          updated[index] = {

            name:
              location.name,

            latitude:
              String(
                location.latitude
              ),

            longitude:
              String(
                location.longitude
              ),

          };


          updateFormFromStops(
            updated
          );


          // ------------------------------------------------
          // Recalculate route whenever ANY stop changes.
          // This ensures the route always goes through
          // every selected stop in sequence.
          // ------------------------------------------------

          const allStopsSelected =
            updated.every(
              (stop) =>
                stop.name &&
                stop.latitude &&
                stop.longitude
            );

          if (allStopsSelected) {

            recalculateRouteFromStops(
              updated
            );

          }


          return updated;

        }
      );

    },
    [
      updateFormFromStops,
      recalculateRouteFromStops,
    ]
  );


  // ==========================================================
  // ADD STOP
  // ==========================================================

  const addStop = () => {

    if (
      stops.length >= MAX_STOPS
    ) {

      return;

    }


    setStops(
      (previous) => [

        ...previous,

        {
          name: "",

          latitude: "",

          longitude: "",

        },

      ]
    );

  };


  // ==========================================================
  // REMOVE STOP
  // ==========================================================

  const removeStop = (
    index: number
  ) => {

    // -----------------------------------------------
    // Never allow fewer than 2 stops.
    // -----------------------------------------------

    if (
      stops.length <= MIN_STOPS
    ) {

      alert(
        "A corridor must have at least 2 stops."
      );

      return;

    }


    const updated =
      stops.filter(
        (_, stopIndex) =>
          stopIndex !== index
      );


    setStops(
      updated
    );


    updateFormFromStops(
      updated
    );


    setRouteDuration(null);

    setRouteError("");


    // -----------------------------------------------
    // Recalculate route after removing a stop.
    // -----------------------------------------------

    recalculateRouteFromStops(
      updated
    );

  };


  // ==========================================================
  // CREATE CORRIDOR
  // ==========================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {

    event.preventDefault();


    try {

      const token =
        localStorage.getItem(
          "access_token"
        );


      if (!token) {

        alert(
          "You are not logged in."
        );

        return;

      }


      // ------------------------------------------------------
      // Corridor name
      // ------------------------------------------------------

      if (!form.name.trim()) {

        alert(
          "Please enter a corridor name."
        );

        return;

      }


      // ------------------------------------------------------
      // Minimum / maximum stops
      // ------------------------------------------------------

      if (
        stops.length < MIN_STOPS
      ) {

        alert(
          "A corridor must have at least 2 stops."
        );

        return;

      }


      if (
        stops.length > MAX_STOPS
      ) {

        alert(
          "A corridor can have a maximum of 10 stops."
        );

        return;

      }


      // ------------------------------------------------------
      // Check every stop
      // ------------------------------------------------------

      const incompleteStop =
        stops.find(
          (stop) =>
            !stop.name ||
            !stop.latitude ||
            !stop.longitude
        );


      if (incompleteStop) {

        alert(
          "Please select a location for every stop."
        );

        return;

      }


      // ------------------------------------------------------
      // Check distance
      // ------------------------------------------------------

      if (
        !form.distance_km
      ) {

        alert(
          "Please wait for the route distance to be calculated."
        );

        return;

      }


      // ------------------------------------------------------
      // Create ordered stop payload
      // ------------------------------------------------------

      const stopPayload =
        stops.map(
          (
            stop,
            index
          ) => ({

            name:
              stop.name,

            latitude:
              Number(
                stop.latitude
              ),

            longitude:
              Number(
                stop.longitude
              ),

            sequence_order:
              index + 1,

          })
        );


      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

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

            body:
              JSON.stringify({

                project_id:
                  Number(
                    form.project_id
                  ),

                name:
                  form.name,

                // ------------------------------------------
                // First stop = origin
                // ------------------------------------------

                origin:
                  stops[0].name,

                origin_latitude:
                  Number(
                    stops[0].latitude
                  ),

                origin_longitude:
                  Number(
                    stops[0].longitude
                  ),

                // ------------------------------------------
                // Last stop = destination
                // ------------------------------------------

                destination:
                  stops[
                    stops.length - 1
                  ].name,

                destination_latitude:
                  Number(
                    stops[
                      stops.length - 1
                    ].latitude
                  ),

                destination_longitude:
                  Number(
                    stops[
                      stops.length - 1
                    ].longitude
                  ),

                distance_km:
                  Number(
                    form.distance_km
                  ),

                // ------------------------------------------
                // All ordered stops
                // ------------------------------------------

                stops:
                  stopPayload,

              }),

          }
        );


      if (!response.ok) {

        const errorData =
          await response.text();


        console.error(
          "Backend error:",
          errorData
        );


        throw new Error(
          errorData
        );

      }


      const newCorridor:
        Corridor =
        await response.json();


      // ------------------------------------------------------
      // Update corridor list
      // ------------------------------------------------------

      setCorridors(
        (previous) => [

          ...previous,

          newCorridor,

        ]
      );


      // ------------------------------------------------------
      // Reset form
      // ------------------------------------------------------

      setForm({

        project_id: 1,

        name: "",

        origin: "",

        origin_latitude: "",

        origin_longitude: "",

        destination: "",

        destination_latitude: "",

        destination_longitude: "",

        distance_km: "",

      });


      setStops(
        createInitialStops()
      );


      setRouteDuration(null);

      setRouteError("");


      alert(
        "Corridor created successfully!"
      );


    } catch (error) {

      console.error(
        "Failed to create corridor:",
        error
      );


      alert(
        "Failed to create corridor. Please check the console for details."
      );

    }

  };


  // ==========================================================
  // PAGE
  // ==========================================================

  return (

    <div
      style={{
        padding: "32px",

        maxWidth: "1200px",

        margin: "0 auto",
      }}
    >

      <h1>
        Analysis Corridors
      </h1>


      <p
        style={{
          color: "#666",
        }}
      >
        Create and manage custom
        traffic analysis corridors.
      </p>


      {/* ====================================================
          CREATE CORRIDOR
          ==================================================== */}

      <div
        style={{
          marginTop: "30px",

          padding: "24px",

          border:
            "1px solid #ddd",

          borderRadius: "10px",

          background: "white",
        }}
      >

        <h2>
          Create Analysis Corridor
        </h2>


        <form
          onSubmit={handleSubmit}
        >

          {/* ==================================================
              CORRIDOR NAME
              ================================================== */}

          <div
            style={{
              marginBottom:
                "20px",
            }}
          >

            <label>
              Corridor Name
            </label>


            <input
              type="text"

              name="name"

              value={
                form.name
              }

              onChange={
                handleChange
              }

              placeholder="Matara - Colombo"

              required

              style={
                inputStyle
              }
            />

          </div>


          {/* ==================================================
              CORRIDOR STOPS
              ================================================== */}

          <div
            style={{
              marginTop:
                "30px",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                marginBottom:
                  "16px",
              }}
            >

              <div>

                <h3
                  style={{
                    margin: 0,
                  }}
                >
                  Corridor Stops
                </h3>


                <p
                  style={{
                    marginTop:
                      "6px",

                    color:
                      "#64748b",

                    fontSize:
                      "14px",
                  }}
                >
                  Start with 2 stops.
                  Add intermediate
                  stops when needed,
                  up to 10 stops.
                </p>

              </div>


              <div
                style={{
                  padding:
                    "8px 12px",

                  borderRadius:
                    "999px",

                  background:
                    "#eff6ff",

                  color:
                    "#1d4ed8",

                  fontSize:
                    "13px",

                  fontWeight:
                    600,
                }}
              >

                {stops.length} / 10 Stops

              </div>

            </div>


            {/* ==================================================
                STOP LIST
                ================================================== */}

            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap: "16px",
              }}
            >

              {stops.map(
                (
                  stop,
                  index
                ) => {

                  const isFirst =
                    index === 0;

                  const isLast =
                    index ===
                    stops.length - 1;


                  return (

                    <div
                      key={
                        index
                      }

                      style={{
                        border:
                          "1px solid #e2e8f0",

                        borderRadius:
                          "10px",

                        padding:
                          "18px",

                        background:
                          "#f8fafc",
                      }}
                    >

                      {/* STOP HEADER */}

                      <div
                        style={{
                          display:
                            "flex",

                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          marginBottom:
                            "12px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "10px",
                          }}
                        >

                          <div
                            style={{
                              width:
                                "32px",

                              height:
                                "32px",

                              borderRadius:
                                "50%",

                              background:
                                "#2563eb",

                              color:
                                "white",

                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              fontWeight:
                                700,
                            }}
                          >

                            {index + 1}

                          </div>


                          <div>

                            <strong>
                              Stop{" "}
                              {index + 1}
                            </strong>


                            <div
                              style={{
                                fontSize:
                                  "12px",

                                color:
                                  "#64748b",

                                marginTop:
                                  "2px",
                              }}
                            >

                              {isFirst
                                ? "Origin"
                                : isLast
                                ? "Destination"
                                : "Intermediate stop"}

                            </div>

                          </div>

                        </div>


                        {/* REMOVE */}

                        {stops.length >
                          MIN_STOPS && (

                          <button
                            type="button"

                            onClick={() =>
                              removeStop(
                                index
                              )
                            }

                            style={{
                              border:
                                "none",

                              background:
                                "#fee2e2",

                              color:
                                "#b91c1c",

                              borderRadius:
                                "6px",

                              padding:
                                "7px 10px",

                              cursor:
                                "pointer",

                              fontSize:
                                "13px",
                            }}
                          >

                            Remove

                          </button>

                        )}

                      </div>


                      {/* LOCATION PICKER */}

                      <LocationPicker
                        label={`Search for Stop ${
                          index + 1
                        }`}

                        placeholder={`Search for ${
                          isFirst
                            ? "starting location"
                            : isLast
                            ? "destination"
                            : "a corridor stop"
                        }...`}

                        onLocationSelect={(
                          location
                        ) =>
                          handleStopSelect(
                            index,
                            location
                          )
                        }
                      />


                      {/* SELECTED LOCATION */}

                      {stop.name && (

                        <div
                          style={
                            locationInfoStyle
                          }
                        >

                          <strong>
                            {stop.name}
                          </strong>


                          <div>
                            Latitude:{" "}
                            {
                              stop.latitude
                            }
                          </div>


                          <div>
                            Longitude:{" "}
                            {
                              stop.longitude
                            }
                          </div>

                        </div>

                      )}

                    </div>

                  );

                }
              )}

            </div>


            {/* ==================================================
                ADD STOP
                ================================================== */}

            {stops.length <
              MAX_STOPS && (

              <button
                type="button"

                onClick={
                  addStop
                }

                style={{
                  marginTop:
                    "16px",

                  padding:
                    "10px 16px",

                  border:
                    "1px solid #2563eb",

                  borderRadius:
                    "6px",

                  background:
                    "white",

                  color:
                    "#2563eb",

                  cursor:
                    "pointer",

                  fontWeight:
                    600,
                }}
              >

                + Add Stop

              </button>

            )}


            {stops.length ===
              MAX_STOPS && (

              <p
                style={{
                  marginTop:
                    "10px",

                  color:
                    "#64748b",

                  fontSize:
                    "13px",
                }}
              >

                Maximum of 10 stops
                reached.

              </p>

            )}

          </div>


          {/* ==================================================
              ROUTE INFORMATION
              ================================================== */}

          <div
            style={{
              marginTop:
                "24px",

              padding:
                "16px",

              background:
                "#f8fafc",

              border:
                "1px solid #e2e8f0",

              borderRadius:
                "8px",
            }}
          >

            <h3>
              Route Information
            </h3>


            {routeLoading ? (

              <p>
                Calculating road
                route...
              </p>

            ) : routeError ? (

              <p
                style={{
                  color:
                    "#dc2626",
                }}
              >
                {routeError}
              </p>

            ) : form.distance_km ? (

              <>

                <p>

                  <strong>
                    Road Distance:
                  </strong>{" "}

                  {form.distance_km}
                  {" "}
                  km

                </p>


                {routeDuration !==
                  null && (

                  <p>

                    <strong>
                      Estimated Travel
                      Time:
                    </strong>{" "}

                    {routeDuration.toFixed(
                      0
                    )}
                    {" "}
                    minutes

                  </p>

                )}

              </>

            ) : (

              <p
                style={{
                  color:
                    "#64748b",
                }}
              >
                Select the first and
                last stops to calculate
                the road route.
              </p>

            )}

          </div>


          {/* ==================================================
              CREATE BUTTON
              ================================================== */}

          <button
            type="submit"

            disabled={
              routeLoading ||
              stops.length < MIN_STOPS
            }

            style={{
              marginTop:
                "24px",

              padding:
                "12px 24px",

              border:
                "none",

              borderRadius:
                "6px",

              background:
                routeLoading ||
                stops.length < MIN_STOPS
                  ? "#94a3b8"
                  : "#2563eb",

              color:
                "white",

              cursor:
                routeLoading ||
                stops.length < MIN_STOPS
                  ? "not-allowed"
                  : "pointer",

              fontWeight:
                600,
            }}
          >

            {routeLoading
              ? "Calculating Route..."
              : "Create Corridor"}

          </button>

        </form>

      </div>


      {/* ====================================================
          EXISTING CORRIDORS
          ==================================================== */}

      <div
        style={{
          marginTop:
            "40px",
        }}
      >

        <h2>
          Existing Corridors
        </h2>


        {loading ? (

          <p>
            Loading corridors...
          </p>

        ) : corridors.length ===
          0 ? (

          <p>
            No corridors found.
          </p>

        ) : (

          <div>

            {corridors.map(
              (corridor) => (

                <div
                  key={
                    corridor.id
                  }

                  style={{
                    padding:
                      "20px",

                    marginBottom:
                      "20px",

                    border:
                      "1px solid #ddd",

                    borderRadius:
                      "8px",

                    background:
                      "white",
                  }}
                >

                  <h3>
                    {
                      corridor.name
                    }
                  </h3>


                  <p>

                    <strong>
                      {
                        corridor.origin
                      }
                    </strong>

                    {" → "}

                    <strong>
                      {
                        corridor.destination
                      }
                    </strong>

                  </p>


                  <p>

                    Distance:{" "}

                    {
                      corridor.distance_km
                    }

                    {" "}
                    km

                  </p>


                  <p>

                    Status:{" "}

                    {
                      corridor.status
                    }

                  </p>


                  {/* ==================================================
                      EXISTING STOPS
                      ================================================== */}

                  {corridor.stops &&
                    corridor.stops.length >
                      0 && (

                    <div
                      style={{
                        marginTop:
                          "16px",

                        padding:
                          "14px",

                        background:
                          "#f8fafc",

                        border:
                          "1px solid #e2e8f0",

                        borderRadius:
                          "8px",
                      }}
                    >

                      <strong>
                        Corridor Stops
                      </strong>


                      <div
                        style={{
                          display:
                            "flex",

                          flexWrap:
                            "wrap",

                          gap:
                            "8px",

                          marginTop:
                            "10px",
                        }}
                      >

                        {[
                          ...corridor.stops,
                        ]
                          .sort(
                            (
                              a,
                              b
                            ) =>
                              a.sequence_order -
                              b.sequence_order
                          )
                          .map(
                            (
                              stop
                            ) => (

                              <div
                                key={
                                  stop.id ??
                                  stop.sequence_order
                                }

                                style={{
                                  padding:
                                    "8px 12px",

                                  background:
                                    "white",

                                  border:
                                    "1px solid #cbd5e1",

                                  borderRadius:
                                    "6px",

                                  fontSize:
                                    "13px",
                                }}
                              >

                                <strong>
                                  {
                                    stop.sequence_order
                                  }
                                  .
                                </strong>

                                {" "}

                                {
                                  stop.name
                                }

                              </div>

                            )
                          )}

                      </div>

                    </div>

                  )}


                  {/* ==================================================
                      GOOGLE MAP
                      ================================================== */}

                  <div
                    style={{
                      marginTop:
                        "20px",
                    }}
                  >

                    <CorridorMap

                      originLatitude={
                        corridor.origin_latitude
                      }

                      originLongitude={
                        corridor.origin_longitude
                      }

                      destinationLatitude={
                        corridor.destination_latitude
                      }

                      destinationLongitude={
                        corridor.destination_longitude
                      }

                      stops={
                        corridor.stops ?? []
                      }


                    />

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>

  );

}


// ============================================================
// INITIAL STOPS
// ============================================================

function createInitialStops(): StopForm[] {

  return Array.from(
    {
      length: MIN_STOPS,
    },
    () => ({

      name: "",

      latitude: "",

      longitude: "",

    })
  );

}


// ============================================================
// STYLES
// ============================================================

const inputStyle:
  React.CSSProperties = {

  width:
    "100%",

  padding:
    "10px",

  marginTop:
    "6px",

  marginBottom:
    "12px",

  border:
    "1px solid #ccc",

  borderRadius:
    "6px",

  boxSizing:
    "border-box",
};


const locationInfoStyle:
  React.CSSProperties = {

  marginTop:
    "10px",

  padding:
    "12px",

  background:
    "#f8fafc",

  border:
    "1px solid #e2e8f0",

  borderRadius:
    "6px",

  fontSize:
    "14px",

  color:
    "#475569",
};