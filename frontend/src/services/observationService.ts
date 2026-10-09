const API_BASE_URL = "http://127.0.0.1:8000";

export interface TrafficObservation {
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

export interface LatestActiveCorridor {
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

export interface SegmentTrafficObservation {
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


async function getAuthHeaders(): Promise<HeadersInit> {
  const token =
    localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}


export async function getLatestActiveCorridors(): Promise<
  LatestActiveCorridor[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/observations/latest/active`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest traffic data: ${response.status}`
    );
  }

  return response.json();
}


export async function getCorridorObservations(
  corridorId: number
): Promise<TrafficObservation[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/observations/corridor/${corridorId}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch corridor observations: ${response.status}`
    );
  }

  return response.json();
}


export async function getLatestSegmentObservations(
  corridorId: number
): Promise<SegmentTrafficObservation[]> {
  const response = await fetch(
    `${API_BASE_URL}/segment-observations/corridor/${corridorId}/latest`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest segment traffic data: ${response.status}`
    );
  }

  return response.json();
}


export async function getSegmentObservations(
  corridorId: number
): Promise<SegmentTrafficObservation[]> {
  const response = await fetch(
    `${API_BASE_URL}/segment-observations/corridor/${corridorId}`,
    {
      method: "GET",
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch segment traffic data: ${response.status}`
    );
  }

  return response.json();
}