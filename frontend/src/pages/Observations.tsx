import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

interface Corridor {
  id: number;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
}

interface Observation {
  id: number;
  corridor_id: number;
  observed_at: string;
  travel_time_minutes: number;
  distance_km: number;
  average_speed_kmh: number;
  traffic_condition: string;
  data_source: string;
  created_at: string;
}

export default function Observations() {
  const [corridors, setCorridors] =
    useState<Corridor[]>([]);

  const [observations, setObservations] =
    useState<Observation[]>([]);

  const [selectedCorridorId, setSelectedCorridorId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const fetchObservations = async (
    corridorId: number
  ) => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/observations/corridor/${corridorId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch observations"
        );
      }

      const data = await response.json();

      setObservations(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch(`${API_URL}/corridors`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch corridors");
        }

        const data: Corridor[] = await response.json();

        setCorridors(data);

        // Automatically select the first available corridor
        if (data.length > 0) {
          const firstCorridorId = String(data[0].id);

          setSelectedCorridorId(firstCorridorId);

          await fetchObservations(data[0].id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedCorridorId) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchObservations(Number(selectedCorridorId));
    }, 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [selectedCorridorId]);

  const handleExportExcel = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        alert("You are not logged in.");
        return;
      }

      const corridorParameter =
        selectedCorridorId
          ? `?corridor_id=${selectedCorridorId}`
          : "";

      const response = await fetch(
        `${API_URL}/exports/traffic-excel${corridorParameter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to export Excel file."
        );
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "mtrada_traffic_history.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);

      alert(
        "Failed to export traffic data."
      );
    }
  };

  const handleCorridorChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const corridorId =
      event.target.value;

    setSelectedCorridorId(
      corridorId
    );

    setObservations([]);

    if (corridorId) {
      await fetchObservations(
        Number(corridorId)
      );
    }
  };

  const selectedCorridor =
    corridors.find(
      (corridor) =>
        corridor.id ===
        Number(selectedCorridorId)
    );



  if (loading) {
    return (
      <div
        style={{
          padding: "32px",
        }}
      >
        <p>
          Loading observations...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1>
        Traffic Observations
      </h1>

      <p
        style={{
          color: "#666",
        }}
      >
        Collect and manage traffic
        observations for analysis
        corridors.
      </p>

      {/* ====================================== */}
      {/* SELECT CORRIDOR */}
      {/* ====================================== */}

      <div
        style={{
          marginTop: "30px",
          padding: "24px",
          background: "white",
          border:
            "1px solid #ddd",
          borderRadius: "10px",
        }}
      >
        <h2>
          Select Analysis Corridor
        </h2>

        <select
          value={
            selectedCorridorId
          }
          onChange={
            handleCorridorChange
          }
          style={inputStyle}
        >
          <option value="">
            Select a corridor...
          </option>

          {corridors.map(
            (corridor) => (
              <option
                key={corridor.id}
                value={corridor.id}
              >
                {corridor.name}
              </option>
            )
          )}
        </select>

        {selectedCorridor && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background:
                "#f8fafc",
              border:
                "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <h3>
              {
                selectedCorridor.name
              }
            </h3>

            <p>
              {
                selectedCorridor.origin
              }{" "}
              →{" "}
              {
                selectedCorridor.destination
              }
            </p>

            <p>
              Distance:{" "}
              {
                selectedCorridor.distance_km
              }{" "}
              km
            </p>
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* AUTOMATIC COLLECTION STATUS */}
      {/* ====================================== */}

      {selectedCorridor && (
        <div
          style={{
            marginTop: "24px",
            padding: "24px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h2>
            Automatic Traffic Collection
          </h2>

          <p
            style={{
              color: "#475569",
              lineHeight: "1.6",
            }}
          >
            Traffic observations for this corridor
            are collected automatically from the
            Google Routes API by the M-TRADA traffic
            collection system.
          </p>

          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          >
            <strong>
              Collection interval
            </strong>

            <p
              style={{
                marginTop: "6px",
                marginBottom: 0,
                color: "#64748b",
              }}
            >
              Traffic data is collected automatically
              every 15 minutes.
            </p>
          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* OBSERVATION HISTORY */}
      {/* ====================================== */}

      {selectedCorridor && (
        <div
          style={{
            marginTop: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              Observation History
            </h2>

            <button
              onClick={handleExportExcel}
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Export Excel
            </button>
          </div>

          {observations.length ===
          0 ? (
            <p
              style={{
                color:
                  "#64748b",
              }}
            >
              No observations
              recorded for this
              corridor yet.
            </p>
          ) : (
            <div>
              {observations.map(
                (observation) => (
                  <div
                    key={
                      observation.id
                    }
                    style={{
                      padding:
                        "20px",
                      marginBottom:
                        "12px",
                      background:
                        "white",
                      border:
                        "1px solid #ddd",
                      borderRadius:
                        "8px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(4, 1fr)",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Date & Time
                        </p>

                        <strong>
                          {new Date(
                            observation.observed_at
                          ).toLocaleString()}
                        </strong>
                      </div>

                      <div>
                        <p
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Travel Time
                        </p>

                        <strong>
                          {observation.travel_time_minutes.toFixed(2)}{" "}
                          min
                        </strong>
                      </div>

                      <div>
                        <p
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Average Speed
                        </p>

                        <strong>
                          {observation.average_speed_kmh.toFixed(2)}{" "}
                          km/h
                        </strong>
                      </div>

                      <div>
                        <p
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Traffic
                        </p>

                        <strong>
                          {
                            observation.traffic_condition
                          }
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  marginBottom: "12px",
  border:
    "1px solid #ccc",
  borderRadius: "6px",
  boxSizing:
    "border-box",
  background: "white",
};