// ─── Village Partner commission constants ─────────────────────────────────────

/** Village partner receives 30% of the platform commission on each ride */
export const PARTNER_COMMISSION_SHARE = 0.30;

/** First month is free — no fee charged to the partner */
export const FIRST_MONTH_FREE_DAYS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartnerCommissionResult {
  platformCommission: number;  // e.g. ₹8 (8% of ₹100)
  partnerShare: number;        // e.g. ₹2.40 (30% of ₹8), rounded
  platformRetains: number;     // e.g. ₹5.60
}

export interface PartnerDashboardStats {
  driversRegistered: number;
  activeVillagers: number;
  totalRidesCompleted: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  settledCommission: number;
  performanceHealth: "excellent" | "good" | "growing" | "new";
}

// ─── Commission calculation ───────────────────────────────────────────────────

/**
 * Calculate village partner's share of a completed ride's platform commission.
 *
 * Example:
 *   Ride fare: ₹100
 *   Platform commission: ₹10 (at 10% rate)
 *   Partner share: ₹3 (30% of ₹10)
 */
export function calculatePartnerCommission(
  platformCommission: number
): PartnerCommissionResult {
  const partnerShare = Math.round(platformCommission * PARTNER_COMMISSION_SHARE * 100) / 100;
  return {
    platformCommission,
    partnerShare,
    platformRetains: Math.round((platformCommission - partnerShare) * 100) / 100,
  };
}

/**
 * Returns whether a partner is still in their free first month.
 */
export function isInFreePeriod(joinedAt: Date): boolean {
  const freeUntil = new Date(joinedAt.getTime() + FIRST_MONTH_FREE_DAYS * 24 * 60 * 60 * 1000);
  return new Date() < freeUntil;
}

/**
 * Derive the `firstMonthFreeUntil` date from registration time.
 */
export function getFirstMonthFreeUntil(joinedAt: Date): Date {
  return new Date(joinedAt.getTime() + FIRST_MONTH_FREE_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Calculate a performance health indicator for the dashboard.
 *
 * Thresholds (rides completed by drivers the partner registered):
 *   excellent : 200+
 *   good      : 50+
 *   growing   : 10+
 *   new       : < 10
 */
export function getPerformanceHealth(
  totalRidesCompleted: number
): PartnerDashboardStats["performanceHealth"] {
  if (totalRidesCompleted >= 200) return "excellent";
  if (totalRidesCompleted >= 50) return "good";
  if (totalRidesCompleted >= 10) return "growing";
  return "new";
}

/** Format an INR amount with the rupee symbol */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
