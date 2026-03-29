import { prisma } from "@/lib/prisma";
import { VehicleType } from "@prisma/client";

// ─── Constants ───────────────────────────────────────────────────────────────

// Default search radius in km
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 20;

// Haversine distance in km between two lat/lng points
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NearbyDriver {
  driverId: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  distanceKm: number;
  avgVillageTrustScore: number;
  panchayatEndorsed: boolean;
  isKnownByPassenger: boolean;  // if passenger has ridden with them before
  ridesThisMonth: number;
  plan: string;
}

// ─── Find nearby available drivers ───────────────────────────────────────────

/**
 * Find available drivers near a pickup point.
 * Returns drivers sorted by: known > panchayat-endorsed > trust score > distance.
 *
 * This is the core of the community-first matching philosophy —
 * familiar drivers surface first, not just the closest stranger.
 */
export async function findNearbyDrivers(params: {
  pickupLat: number;
  pickupLng: number;
  vehicleType?: VehicleType;
  passengerId: string;
  villageId?: string;
  radiusKm?: number;
}): Promise<NearbyDriver[]> {
  const {
    pickupLat,
    pickupLng,
    vehicleType,
    passengerId,
    villageId,
    radiusKm = DEFAULT_RADIUS_KM,
  } = params;

  // Fetch all available drivers with current location
  const drivers = await prisma.driver.findMany({
    where: {
      isAvailable: true,
      isVerified: true,
      currentLat: { not: null },
      currentLng: { not: null },
      ...(vehicleType && { vehicleType }),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      villageTrust: {
        where: villageId ? { villageId } : {},
      },
      knownByPassengers: {
        where: { passengerId },
      },
    },
  });

  // Filter by radius using haversine distance
  const nearby = drivers
    .filter((d) => {
      if (!d.currentLat || !d.currentLng) return false;
      const dist = haversineDistance(pickupLat, pickupLng, d.currentLat, d.currentLng);
      return dist <= Math.min(radiusKm, MAX_RADIUS_KM);
    })
    .map((d) => {
      const dist = haversineDistance(pickupLat, pickupLng, d.currentLat!, d.currentLng!);
      const trust = d.villageTrust[0];
      const isKnown = d.knownByPassengers.length > 0;

      return {
        driverId: d.id,
        userId: d.userId,
        name: d.user.name,
        phone: d.user.phone,
        vehicleType: d.vehicleType,
        vehicleNumber: d.vehicleNumber,
        distanceKm: Math.round(dist * 10) / 10,
        avgVillageTrustScore: trust?.avgScore ?? 0,
        panchayatEndorsed: trust?.panchayatEndorsed ?? false,
        isKnownByPassenger: isKnown,
        ridesThisMonth: d.ridesThisMonth,
        plan: d.plan,
      };
    });

  // Sort: known drivers first → panchayat endorsed → trust score → distance
  nearby.sort((a, b) => {
    if (a.isKnownByPassenger !== b.isKnownByPassenger) {
      return a.isKnownByPassenger ? -1 : 1;
    }
    if (a.panchayatEndorsed !== b.panchayatEndorsed) {
      return a.panchayatEndorsed ? -1 : 1;
    }
    if (b.avgVillageTrustScore !== a.avgVillageTrustScore) {
      return b.avgVillageTrustScore - a.avgVillageTrustScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  return nearby;
}

// ─── Return trip matching ─────────────────────────────────────────────────────

/**
 * After a driver completes a ride from A→B, find passengers at B wanting to go to A.
 * This is the 3% commission incentive engine — empty return trips kill rural economics.
 */
export async function findReturnTripMatch(params: {
  driverLat: number;        // current location (at destination B)
  driverLng: number;
  originalPickupLat: number; // original pickup (A)
  originalPickupLng: number;
  vehicleType: VehicleType;
  radiusKm?: number;
}): Promise<{ rideId: string; passengerId: string; dropAddress: string; distanceKm: number }[]> {
  const { driverLat, driverLng, originalPickupLat, originalPickupLng, vehicleType, radiusKm = 3 } = params;

  // Find REQUESTED rides near driver's current location going roughly back toward origin
  const pendingRides = await prisma.ride.findMany({
    where: {
      status: "REQUESTED",
      vehicleType,
      driverId: null,
    },
    select: {
      id: true,
      passengerId: true,
      pickupLat: true,
      pickupLng: true,
      dropLat: true,
      dropLng: true,
      dropAddress: true,
    },
  });

  return pendingRides
    .filter((ride) => {
      // Passenger's pickup must be near driver's current location
      const pickupDist = haversineDistance(driverLat, driverLng, ride.pickupLat, ride.pickupLng);
      // Passenger's drop must be near the driver's original pickup (completing the return)
      const dropDist = haversineDistance(
        originalPickupLat, originalPickupLng,
        ride.dropLat, ride.dropLng
      );
      return pickupDist <= radiusKm && dropDist <= radiusKm * 2;
    })
    .map((ride) => ({
      rideId: ride.id,
      passengerId: ride.passengerId,
      dropAddress: ride.dropAddress,
      distanceKm: Math.round(
        haversineDistance(driverLat, driverLng, ride.dropLat, ride.dropLng) * 10
      ) / 10,
    }));
}

// ─── Update driver location ───────────────────────────────────────────────────

/**
 * Update a driver's current location in the database.
 * Called every 30s from the driver app while they're available.
 */
export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number
): Promise<void> {
  await prisma.driver.update({
    where: { id: driverId },
    data: {
      currentLat: lat,
      currentLng: lng,
      locationUpdatedAt: new Date(),
    },
  });
}
