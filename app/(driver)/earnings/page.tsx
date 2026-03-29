"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Lightbulb } from "lucide-react";
import { SUBSCRIPTION_PRICE, subscriptionBreakEven, projectMonthlyEarnings } from "@/lib/commission";
import type { DriverPlan } from "@prisma/client";

// Re-export from commission so we can use it client-side
function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function EarningsPage() {
  const { data: session } = useSession();
  const [avgFare, setAvgFare] = useState(200);
  const [ridesPerMonth, setRidesPerMonth] = useState(40);
  const plan: DriverPlan = "FREE"; // would come from driver profile

  const freeProjection = projectMonthlyEarnings({
    ridesPerMonth,
    averageFare: avgFare,
    driverPlan: "FREE",
    subscriptionExpiresAt: null,
  });

  const premiumProjection = projectMonthlyEarnings({
    ridesPerMonth,
    averageFare: avgFare,
    driverPlan: "PREMIUM",
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const breakEven = subscriptionBreakEven(avgFare);
  const premiumSavings = freeProjection.finalTakeHome - premiumProjection.finalTakeHome;
  const isPremiumBetter = premiumProjection.finalTakeHome > freeProjection.finalTakeHome;

  return (
    <main className="min-h-screen bg-brand-cream pb-8">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <a href="/driver/dashboard" className="text-brand-green-pale text-sm">← Dashboard</a>
        <h1 className="text-xl font-bold mt-2">Earnings & Commission</h1>
        <p className="text-brand-green-pale text-sm mt-0.5">Plan: Free (8%)</p>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* Commission rates card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Commission Rates</p>
          <div className="space-y-2">
            {[
              { label: "Premium subscription", rate: "0%", desc: "₹599/month — no per-ride cut", highlight: true },
              { label: "Return trip match", rate: "3%", desc: "If you match a return passenger" },
              { label: "Loyalty (50+ rides/month)", rate: "5%", desc: `You're at ${ridesPerMonth} rides/month` },
              { label: "Standard (free plan)", rate: "8%", desc: "Default rate" },
            ].map((r) => (
              <div
                key={r.label}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  r.highlight ? "bg-brand-green-pale" : "bg-gray-50"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${r.highlight ? "text-brand-green" : "text-gray-700"}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                <span className={`text-xl font-bold ${r.highlight ? "text-brand-green" : "text-gray-600"}`}>
                  {r.rate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings calculator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-700 mb-4">Monthly Earnings Projection</p>

          <div className="space-y-4 mb-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-gray-500">Rides per month</label>
                <span className="text-xs font-bold text-brand-green">{ridesPerMonth}</span>
              </div>
              <input
                type="range" min={1} max={200} value={ridesPerMonth}
                onChange={(e) => setRidesPerMonth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-gray-500">Average fare per ride</label>
                <span className="text-xs font-bold text-brand-green">₹{avgFare}</span>
              </div>
              <input
                type="range" min={50} max={1000} step={10} value={avgFare}
                onChange={(e) => setAvgFare(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Comparison table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-2">Free Plan</p>
              <p className="text-xs text-gray-500">Gross: {formatCurrency(freeProjection.grossRevenue)}</p>
              <p className="text-xs text-gray-500">Commission: −{formatCurrency(freeProjection.totalCommission)}</p>
              <p className="text-base font-bold text-gray-700 mt-2 border-t pt-2">
                {formatCurrency(freeProjection.finalTakeHome)}
              </p>
            </div>
            <div
              className={`rounded-xl p-3 ${
                isPremiumBetter ? "border-2 border-brand-green bg-brand-green-pale" : "border border-gray-200"
              }`}
            >
              <p className={`text-xs mb-2 ${isPremiumBetter ? "text-brand-green font-bold" : "text-gray-400"}`}>
                Premium ₹599/mo {isPremiumBetter ? <CheckCircle size={11} className="inline ml-1" /> : ""}
              </p>
              <p className="text-xs text-gray-500">Gross: {formatCurrency(premiumProjection.grossRevenue)}</p>
              <p className="text-xs text-gray-500">Commission: ₹0</p>
              <p className="text-xs text-gray-500">Sub: −₹599</p>
              <p className={`text-base font-bold mt-2 border-t pt-2 ${isPremiumBetter ? "text-brand-green" : "text-gray-700"}`}>
                {formatCurrency(premiumProjection.finalTakeHome)}
              </p>
            </div>
          </div>

          {isPremiumBetter && (
            <div className="mt-3 bg-brand-green-pale rounded-xl px-3 py-2">
              <p className="text-xs text-brand-green font-semibold">
                Premium saves you {formatCurrency(Math.abs(premiumSavings))} this month
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3 text-center">
            Break-even: ~{breakEven} rides/month at ₹{avgFare} avg
          </p>
        </div>

        {/* Upgrade CTA */}
        {plan === "FREE" && (
          <div className="bg-brand-green rounded-2xl p-5 text-white">
            <p className="font-bold text-base">Go Premium</p>
            <p className="text-brand-green-pale text-sm mt-1">
              ₹599/month · No per-ride commission · Pay at your petrol pump or CSC
            </p>
            <button className="mt-4 w-full bg-white text-brand-green py-3 rounded-xl font-bold text-sm">
              Upgrade for ₹599/month
            </button>
          </div>
        )}

        {/* Return trip reminder */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Lightbulb size={15} className="text-saffron-500" /> Empty Return Trip?</p>
          <p className="text-xs text-gray-500 mt-1">
            After completing a ride, check for return-trip passengers going back your way.
            Return trips earn only 3% commission — more money in your pocket.
          </p>
          <a
            href="/driver/dashboard"
            className="inline-block mt-3 text-brand-green text-xs font-semibold"
          >
            Find return passengers →
          </a>
        </div>
      </div>
    </main>
  );
}
