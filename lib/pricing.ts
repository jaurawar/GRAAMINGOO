import { VehicleType, RideType } from "@prisma/client";

// ─── Base rates (₹ per km) ───────────────────────────────────────────────────
export const BASE_RATES: Record<VehicleType, number> = {
  BIKE: 8,
  AUTO: 12,
  SUV: 16,
  TEMPO: 20,
};

// ₹ added to every ride regardless of distance
const BOOKING_FEE = 20;

// ±15% driver-adjustable band
const BAND_PERCENT = 0.15;

// Emergency surcharge locked on top of system fare
const EMERGENCY_FEE = 100;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FareEstimate {
  systemFare: number;   // what the platform suggests
  minFare: number;      // floor of driver's adjustable band (−15%)
  maxFare: number;      // ceiling of driver's adjustable band (+15%)
  bandPercent: number;  // 0.15 — useful for slider UI
  bookingFee: number;
  baseRate: number;
  distanceKm: number;
}

export interface EmergencyFare {
  systemFare: number;
  emergencyFee: number;
  totalFare: number;    // locked — no negotiation allowed
}

// ─── Core fare calculation ────────────────────────────────────────────────────

/**
 * Calculate the platform's suggested system fare.
 * system_fare = (base_rate × distance_km) + booking_fee
 */
export function calculateSystemFare(
  vehicleType: VehicleType,
  distanceKm: number
): number {
  const baseRate = BASE_RATES[vehicleType];
  return Math.round(baseRate * distanceKm + BOOKING_FEE);
}

/**
 * Full fare estimate with driver-adjustable band.
 * Used when passenger opens the booking screen.
 */
export function getFareEstimate(
  vehicleType: VehicleType,
  distanceKm: number
): FareEstimate {
  const systemFare = calculateSystemFare(vehicleType, distanceKm);
  const minFare = Math.round(systemFare * (1 - BAND_PERCENT));
  const maxFare = Math.round(systemFare * (1 + BAND_PERCENT));

  return {
    systemFare,
    minFare,
    maxFare,
    bandPercent: BAND_PERCENT,
    bookingFee: BOOKING_FEE,
    baseRate: BASE_RATES[vehicleType],
    distanceKm,
  };
}

/**
 * Validate that a driver's quoted fare is within the allowed band.
 * Returns true if the quote is legitimate.
 */
export function isQuoteWithinBand(
  driverQuote: number,
  vehicleType: VehicleType,
  distanceKm: number
): boolean {
  const { minFare, maxFare } = getFareEstimate(vehicleType, distanceKm);
  return driverQuote >= minFare && driverQuote <= maxFare;
}

/**
 * Emergency fare — locked at system fare + ₹100 flat fee.
 * No negotiation is permitted for emergency rides.
 * This is the platform's moral core: no gouging during crises.
 */
export function getEmergencyFare(
  vehicleType: VehicleType,
  distanceKm: number
): EmergencyFare {
  const systemFare = calculateSystemFare(vehicleType, distanceKm);
  return {
    systemFare,
    emergencyFee: EMERGENCY_FEE,
    totalFare: systemFare + EMERGENCY_FEE,
  };
}

/**
 * Format a fare number as Indian Rupees string.
 * e.g. 240 → "₹240"
 */
export function formatFare(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Calculate the percentage difference between driver quote and system fare.
 * Used to display "+8%" or "−5%" in the UI next to driver's quote.
 */
export function fareDeviation(driverQuote: number, systemFare: number): string {
  const diff = ((driverQuote - systemFare) / systemFare) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(0)}%`;
}

// ─── Example usage ────────────────────────────────────────────────────────────
// const estimate = getFareEstimate("SUV", 15);
// → { systemFare: 260, minFare: 221, maxFare: 299, ... }
//
// const emergency = getEmergencyFare("AUTO", 10);
// → { systemFare: 140, emergencyFee: 100, totalFare: 240 }
