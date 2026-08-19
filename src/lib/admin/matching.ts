import "server-only";

import { geocodeAddress, type LatLng } from "@/lib/geocoding";
import { createClient } from "@/lib/supabase/server";
import type { Booking, Customer } from "@/types/database";

// Spec.md §6: score = (distance_weight × proximity_score) + (workload_weight × availability_score)
export const PROXIMITY_WEIGHT = 0.6;
export const WORKLOAD_WEIGHT = 0.4;

// Straight-line radius (km) beyond which proximity score bottoms out at 0.
// Sized for a metro service area; adjust as real coverage data comes in.
const MAX_SERVICE_RADIUS_KM = 25;

const ACTIVE_BOOKING_STATUSES = ["assigned", "en_route", "in_progress"] as const;

export interface TechnicianSuggestion {
  technicianId: string;
  name: string;
  phone: string;
  serviceZone: string;
  branch: string | null;
  distanceKm: number | null;
  activeJobCount: number;
  proximityScore: number;
  availabilityScore: number;
  score: number;
}

export interface SuggestionResult {
  suggestions: TechnicianSuggestion[];
  distanceAvailable: boolean;
}

function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function proximityScoreFor(distanceKm: number): number {
  return Math.max(0, Math.min(1, 1 - distanceKm / MAX_SERVICE_RADIUS_KM));
}

/** Ensures the customer has geocoded coordinates, geocoding + persisting them if missing. */
async function ensureCustomerCoords(customer: Customer): Promise<LatLng | null> {
  if (customer.address_lat != null && customer.address_lng != null) {
    return { lat: customer.address_lat, lng: customer.address_lng };
  }

  const coords = await geocodeAddress(customer.address);
  if (!coords) return null;

  const supabase = await createClient();
  await supabase
    .from("customers")
    .update({ address_lat: coords.lat, address_lng: coords.lng })
    .eq("id", customer.id);

  return coords;
}

export async function suggestTechnicians(
  booking: Booking,
  customer: Customer,
): Promise<SuggestionResult> {
  const supabase = await createClient();

  const [{ data: technicians }, customerCoords] = await Promise.all([
    supabase.from("technicians").select("*").eq("active_status", true),
    ensureCustomerCoords(customer),
  ]);

  if (!technicians || technicians.length === 0) {
    return { suggestions: [], distanceAvailable: customerCoords !== null };
  }

  const technicianIds = technicians.map((t) => t.id);
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("technician_id")
    .eq("preferred_date", booking.preferred_date)
    .in("status", ACTIVE_BOOKING_STATUSES)
    .in("technician_id", technicianIds);

  const activeCountByTechnician = new Map<string, number>();
  for (const row of activeBookings ?? []) {
    if (!row.technician_id) continue;
    activeCountByTechnician.set(row.technician_id, (activeCountByTechnician.get(row.technician_id) ?? 0) + 1);
  }

  const distanceAvailable = customerCoords !== null;

  const suggestions: TechnicianSuggestion[] = technicians.map((technician) => {
    const activeJobCount = activeCountByTechnician.get(technician.id) ?? 0;
    const availabilityScore = 1 / (1 + activeJobCount);

    let distanceKm: number | null = null;
    let proximityScore = 0.5; // neutral when we can't compute a real distance

    if (customerCoords && technician.lat != null && technician.lng != null) {
      distanceKm = haversineDistanceKm(customerCoords, { lat: technician.lat, lng: technician.lng });
      proximityScore = proximityScoreFor(distanceKm);
    }

    const score = PROXIMITY_WEIGHT * proximityScore + WORKLOAD_WEIGHT * availabilityScore;

    return {
      technicianId: technician.id,
      name: technician.name,
      phone: technician.phone,
      serviceZone: technician.service_zone,
      branch: technician.branch,
      distanceKm,
      activeJobCount,
      proximityScore,
      availabilityScore,
      score,
    };
  });

  suggestions.sort((a, b) => b.score - a.score);

  return { suggestions: suggestions.slice(0, 3), distanceAvailable };
}
