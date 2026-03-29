"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Car,
  Users,
  TrendingUp,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  Truck,
  MapPin,
  Activity,
  RefreshCw,
  ChevronRight,
  UserPlus,
  Wallet,
  Star,
  ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartnerInfo {
  id: string;
  name: string;
  village: string;
  district: string;
  state: string;
  joinedAt: string;
  firstMonthFreeUntil: string;
  inFreePeriod: boolean;
}

interface Stats {
  driversRegistered: number;
  activeVillagers: number;
  totalRidesCompleted: number;
  totalCommissionEarned: number;
  settledCommission: number;
  pendingCommission: number;
  performanceHealth: "excellent" | "good" | "growing" | "new";
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: "BIKE" | "AUTO" | "SUV" | "TEMPO";
  isAvailable: boolean;
  totalRides: number;
}

interface Commission {
  rideId: string;
  platformCommission: number;
  partnerShare: number;
  settled: boolean;
  createdAt: string;
}

interface DashboardData {
  partner: PartnerInfo;
  stats: Stats;
  drivers: Driver[];
  recentCommissions: Commission[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const HEALTH_CONFIG = {
  excellent: { label: "Excellent", color: "text-brand-green", bg: "bg-brand-green-pale", bar: "bg-brand-green", width: "w-full" },
  good:      { label: "Good",      color: "text-saffron-600", bg: "bg-saffron-50",       bar: "bg-saffron-500", width: "w-3/4" },
  growing:   { label: "Growing",   color: "text-blue-600",    bg: "bg-blue-50",          bar: "bg-blue-500",    width: "w-1/2" },
  new:       { label: "Starting",  color: "text-gray-500",    bg: "bg-gray-100",         bar: "bg-gray-400",    width: "w-1/4" },
} as const;

const VEHICLE_ICONS: Record<Driver["vehicleType"], React.ElementType> = {
  BIKE: Bike,
  AUTO: Car,
  SUV: Car,
  TEMPO: Truck,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-brand-green border-brand-green text-white" : "bg-white border-gray-100 shadow-sm"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? "bg-white/20" : "bg-brand-green-pale"}`}>
        <Icon size={18} className={accent ? "text-white" : "text-brand-green"} />
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-800"}`}>{value}</p>
      <p className={`text-xs font-semibold mt-0.5 ${accent ? "text-white/80" : "text-gray-500"}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/60" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

function DriverRow({ driver }: { driver: Driver }) {
  const Icon = VEHICLE_ICONS[driver.vehicleType];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-9 h-9 rounded-full bg-brand-green-pale flex items-center justify-center shrink-0">
        <Icon size={15} className="text-brand-green" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-700 truncate">{driver.name}</p>
        <p className="text-xs text-gray-400">{driver.vehicleType} · {driver.totalRides} rides</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`w-2 h-2 rounded-full ${driver.isAvailable ? "bg-brand-green" : "bg-gray-300"}`} />
        <span className="text-xs text-gray-400">{driver.isAvailable ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
}

function CommissionRow({ commission }: { commission: Commission }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${commission.settled ? "bg-brand-green-pale" : "bg-saffron-50"}`}>
        {commission.settled
          ? <CheckCircle2 size={14} className="text-brand-green" />
          : <Clock size={14} className="text-saffron-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">Platform: {formatINR(commission.platformCommission)}</p>
        <p className="text-xs text-gray-400">{formatDate(commission.createdAt)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-brand-green">{formatINR(commission.partnerShare)}</p>
        <p className={`text-xs ${commission.settled ? "text-brand-green" : "text-saffron-600"}`}>
          {commission.settled ? "Settled" : "Pending"}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-5 max-w-md mx-auto">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl skeleton" />
      ))}
      <div className="h-48 rounded-2xl skeleton" />
      <div className="h-40 rounded-2xl skeleton" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VillagePartnerDashboard() {
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId") ?? "";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (!partnerId) { setLoading(false); setError("No partner ID provided."); return; }
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/village-partner/dashboard?partnerId=${encodeURIComponent(partnerId)}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to load dashboard."); return; }
      setData(json);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partnerId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── No partner ID ──────────────────────────────────────────────────────────
  if (!partnerId) {
    return (
      <main className="min-h-screen bg-surface-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Partner ID missing</h2>
        <p className="text-sm text-gray-500">Open this page from the registration confirmation link.</p>
        <a href="/village-partner/register"
          className="mt-2 inline-flex items-center gap-2 bg-brand-green text-white px-5 py-3 rounded-xl text-sm font-bold">
          Register as Village Partner
          <ChevronRight size={15} />
        </a>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (!loading && error) {
    return (
      <main className="min-h-screen bg-surface-cream flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Could not load dashboard</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="mt-2 inline-flex items-center gap-2 bg-brand-green text-white px-5 py-3 rounded-xl text-sm font-bold">
          <RefreshCw size={14} />
          Try again
        </button>
      </main>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-surface-cream pb-10">
        <div className="bg-brand-green text-white px-5 pt-12 pb-8">
          <div className="w-40 h-5 rounded bg-white/20 mb-2" />
          <div className="w-24 h-3 rounded bg-white/10" />
        </div>
        <DashboardSkeleton />
      </main>
    );
  }

  if (!data) return null;

  const { partner, stats, drivers, recentCommissions } = data;
  const health = HEALTH_CONFIG[stats.performanceHealth];
  const freeUntil = formatDate(partner.firstMonthFreeUntil);
  const joinedDate = formatDate(partner.joinedAt);

  return (
    <main className="min-h-screen bg-surface-cream pb-10">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-brand-green-pale text-xs font-semibold uppercase tracking-wide mb-1">Village Partner</p>
            <h1 className="text-xl font-bold">{partner.name}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-brand-green-pale" />
              <p className="text-brand-green-pale text-sm">{partner.village}, {partner.district}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw size={15} className={`text-white ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Free period banner */}
        {partner.inFreePeriod && (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Star size={14} className="text-saffron-300 shrink-0" />
            <p className="text-xs text-white">First month free until {freeUntil}</p>
          </div>
        )}
      </div>

      <div className="px-4 pt-5 space-y-4 max-w-md mx-auto">

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Car}
            label="Drivers Registered"
            value={stats.driversRegistered}
            sub="In your village"
            accent
          />
          <StatCard
            icon={Users}
            label="Active Villagers"
            value={stats.activeVillagers}
            sub="Unique passengers"
          />
          <StatCard
            icon={TrendingUp}
            label="Rides Completed"
            value={stats.totalRidesCompleted}
            sub="All time"
          />
          <StatCard
            icon={IndianRupee}
            label="Total Earned"
            value={formatINR(stats.totalCommissionEarned)}
            sub="30% of platform cut"
          />
        </div>

        {/* Commission breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Commission Summary</p>
            <Wallet size={16} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="text-sm text-gray-600">Total Earned</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{formatINR(stats.totalCommissionEarned)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-600">Settled</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">{formatINR(stats.settledCommission)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-saffron-400" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-bold text-saffron-600">{formatINR(stats.pendingCommission)}</span>
            </div>
          </div>

          {/* Example breakdown */}
          <div className="mt-4 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-2 font-semibold">How it works</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Ride fare example</span>
                <span className="text-gray-700 font-medium">₹100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Platform commission (8%)</span>
                <span className="text-gray-700 font-medium">₹8</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-1">
                <span className="text-brand-green font-semibold">Your share (30%)</span>
                <span className="text-brand-green font-bold">₹2.40</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance health */}
        <div className={`rounded-2xl p-5 border ${health.bg} border-transparent`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className={health.color} />
              <p className={`text-sm font-bold ${health.color}`}>Network Health</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/60 ${health.color}`}>
              {health.label}
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${health.bar} ${health.width}`} />
          </div>
          <p className="text-xs text-gray-500 mt-2.5">
            {stats.performanceHealth === "new" && "Register your first drivers to get started."}
            {stats.performanceHealth === "growing" && `${stats.totalRidesCompleted} rides completed — keep growing!`}
            {stats.performanceHealth === "good" && `${stats.totalRidesCompleted} rides — strong network in ${partner.village}.`}
            {stats.performanceHealth === "excellent" && `${stats.totalRidesCompleted}+ rides — outstanding contribution!`}
          </p>
        </div>

        {/* Registered drivers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-700">Registered Drivers</p>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {drivers.length}
            </span>
          </div>

          {drivers.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <UserPlus size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No drivers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start by registering drivers in {partner.village}.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              {drivers.map((d) => <DriverRow key={d.id} driver={d} />)}
            </div>
          )}
        </div>

        {/* Recent commissions */}
        {recentCommissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-gray-700">Recent Commissions</p>
              <ArrowUpRight size={15} className="text-gray-400" />
            </div>
            <div className="mt-3">
              {recentCommissions.map((c) => <CommissionRow key={c.rideId} commission={c} />)}
            </div>
          </div>
        )}

        {/* Partner info footer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Partner Details</p>
          <div className="space-y-2">
            {[
              { label: "Village", value: partner.village },
              { label: "District", value: partner.district },
              { label: "State", value: partner.state },
              { label: "Member Since", value: joinedDate },
              { label: "Free Period Until", value: freeUntil },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-semibold text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
