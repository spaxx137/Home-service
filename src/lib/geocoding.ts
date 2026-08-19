import "server-only";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Geocodes a free-text address via the Google Maps Geocoding API.
 * Returns null (rather than throwing) if the API key isn't configured or
 * the request fails — callers should degrade gracefully rather than block
 * on this, since it's an external dependency (Spec.md §7).
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "ph");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const payload = await response.json();
    const location = payload?.results?.[0]?.geometry?.location;
    if (typeof location?.lat !== "number" || typeof location?.lng !== "number") return null;

    return { lat: location.lat, lng: location.lng };
  } catch (error) {
    console.error("[geocoding] geocodeAddress failed:", error);
    return null;
  }
}
