// Nominatim (OpenStreetMap) geocoding + OSRM routing — no API key required

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const OSRM_BASE = "https://router.project-osrm.org";

export interface GeoResult {
  displayName: string;
  lat: number;
  lng: number;
  placeId: number;
}

/** Search for addresses/places using Nominatim */
export async function geocodeSearch(
  query: string,
  countryCode = "in"
): Promise<GeoResult[]> {
  if (!query || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5",
    countrycodes: countryCode,
  });
  const res = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { "Accept-Language": "en", "User-Agent": "GraaminGo/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(
    (r: { display_name: string; lat: string; lon: string; place_id: number }) => ({
      displayName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      placeId: r.place_id,
    })
  );
}

/** Reverse geocode: lat/lng → human-readable address */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });
  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
    headers: { "Accept-Language": "en", "User-Agent": "GraaminGo/1.0" },
  });
  if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  /** Decoded polyline points [[lat, lng], ...] */
  polyline: [number, number][];
}

/** Get driving route between two points using OSRM */
export async function getRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<RouteInfo | null> {
  const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    return {
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      polyline: coords,
    };
  } catch {
    return null;
  }
}

/** Straight-line (haversine) distance in km — fallback when OSRM unavailable */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
