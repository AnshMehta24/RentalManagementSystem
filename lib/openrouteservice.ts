/**
 * OpenRouteService API helpers for geocoding and distance.
 * Set OPENROUTESERVICE_API_KEY in env.
 * Docs: https://openrouteservice.org/dev/#/api-docs
 */

const API_KEY = process.env.OPENROUTESERVICE_API_KEY;
const BASE = "https://api.openrouteservice.org";

export type LonLat = [number, number];

/** Build a single-line address string for geocoding */
export function formatAddressForGeocode(addr: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode?: string | null;
}): string {
  const parts = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.country,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

/** Geocode an address string to [longitude, latitude]. Returns null if not found or API error. */
export async function geocodeAddress(
  addressString: string
): Promise<LonLat | null> {
  if (!API_KEY) {
    console.warn("OPENROUTESERVICE_API_KEY not set");
    return null;
  }
  try {
    const url = `${BASE}/geocode/search?api_key=${encodeURIComponent(API_KEY)}&text=${encodeURIComponent(addressString)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    return coords ?? null;
  } catch (e) {
    console.error("OpenRouteService geocode error:", e);
    return null;
  }
}

/** Get driving distance in km between two [lon, lat] points. Returns null on error. */
export async function getDrivingDistanceKm(
  origin: LonLat,
  destination: LonLat
): Promise<number | null> {
  if (!API_KEY) {
    console.warn("OPENROUTESERVICE_API_KEY not set");
    return null;
  }
  try {
    const url = `${BASE}/v2/matrix/driving-car?api_key=${encodeURIComponent(API_KEY)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: [origin, destination],
        metrics: ["distance"],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      distances?: number[][];
    };
    const meters = data.distances?.[0]?.[1];
    if (meters == null) return null;
    return meters / 1000;
  } catch (e) {
    console.error("OpenRouteService matrix error:", e);
    return null;
  }
}
