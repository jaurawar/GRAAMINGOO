import { DriverPlan } from "@prisma/client";

// ─── Commission rates ─────────────────────────────────────────────────────────

const COMMISSION_RATES = {
  PREMIUM_SUBSCRIPTION: 0,     // ₹599/month plan — zero per-ride commission
  LOYALTY: 0.05,               // 50+ rides this month → 5%
  RETURN_TRIP: 0.03,           // matched return trip → 3%
  FREE_DEFAULT: 0.08,          // standard free plan → 8%
} as const;

// Subscription price in INR
export const SUBSCRIPTION_PRICE = 599;

// Loyalty threshold (rides per month to unlock 5% rate)
export const LOYALTY_THRESHOLD = 50;

// Break-even: rides/month at which subscription saves money
// 599 / (0.08 - 0) = ~75 rides at ₹100 avg… but depends on avg fare
// We expose this for UI: "You'll save with Premium after X rides"
export function subscriptionBreakEven(averageFare: number): number {
  // At 8% commission: rides × avg_fare × 0.08 = 599
  // rides = 599 / (avg_fare × 0.08)
  return Math.ceil(SUBSCRIPTION_PRICE / (averageFare * COMMISSION_RATES.FREE_DEFAULT));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommissionResult {
  rate: number;           // e.g. 0.08
  ratePercent: string;    // e.g. "8%"
  amount: number;         // in ₹
  reason: string;         // human-readable reason (for earnings screen)
  driverEarns: number;    // final_fare − commission_amount
}

// ─── Core commission calculation ──────────────────────────────────────────────

/**
 * Determine the commission rate and amount for a completed ride.
 *
 * Priority order:
 * 1. Premium subscription active → 0%
 * 2. Return trip match → 3%
 * 3. Loyalty (50+ rides/month) → 5%
 * 4. Default free plan → 8%
 */
export function calculateCommission(params: {
  finalFare: number;
  driverPlan: DriverPlan;
  subscriptionExpiresAt: Date | null;
  ridesThisMonth: number;
  isReturnTrip: boolean;
}): CommissionResult {
  const { finalFare, driverPlan, subscriptionExpiresAt, ridesThisMonth, isReturnTrip } = params;

  let rate: number;
  let reason: string;

  const isPremiumActive =
    driverPlan === "PREMIUM" &&
    subscriptionExpiresAt !== null &&
    subscriptionExpiresAt > new Date();

  if (isPremiumActive) {
    rate = COMMISSION_RATES.PREMIUM_SUBSCRIPTION;
    reason = "Premium subscription — no per-ride commission";
  } else if (isReturnTrip) {
    rate = COMMISSION_RATES.RETURN_TRIP;
    reason = "Return trip match — 3% commission";
  } else if (ridesThisMonth >= LOYALTY_THRESHOLD) {
    rate = COMMISSION_RATES.LOYALTY;
    reason = `Loyalty reward — ${ridesThisMonth} rides this month, 5% commission`;
  } else {
    rate = COMMISSION_RATES.FREE_DEFAULT;
    reason = "Standard plan — 8% commission";
  }

  const amount = Math.round(finalFare * rate);

  return {
    rate,
    ratePercent: `${(rate * 100).toFixed(0)}%`,
    amount,
    reason,
    driverEarns: finalFare - amount,
  };
}

/**
 * Project monthly earnings for a driver given ride volume.
 * Useful for the earnings dashboard projection widget.
 */
export function projectMonthlyEarnings(params: {
  ridesPerMonth: number;
  averageFare: number;
  driverPlan: DriverPlan;
  subscriptionExpiresAt: Date | null;
}): {
  grossRevenue: number;
  totalCommission: number;
  netEarnings: number;
  subscriptionCost: number;
  finalTakeHome: number;
} {
  const { ridesPerMonth, averageFare, driverPlan, subscriptionExpiresAt } = params;

  const grossRevenue = ridesPerMonth * averageFare;
  const isPremiumActive =
    driverPlan === "PREMIUM" &&
    subscriptionExpiresAt !== null &&
    subscriptionExpiresAt > new Date();

  let rate: number;
  if (isPremiumActive) {
    rate = 0;
  } else if (ridesPerMonth >= LOYALTY_THRESHOLD) {
    rate = COMMISSION_RATES.LOYALTY;
  } else {
    rate = COMMISSION_RATES.FREE_DEFAULT;
  }

  const totalCommission = Math.round(grossRevenue * rate);
  const netEarnings = grossRevenue - totalCommission;
  const subscriptionCost = isPremiumActive ? SUBSCRIPTION_PRICE : 0;
  const finalTakeHome = netEarnings - subscriptionCost;

  return {
    grossRevenue,
    totalCommission,
    netEarnings,
    subscriptionCost,
    finalTakeHome,
  };
}
