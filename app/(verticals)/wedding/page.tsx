"use client";

import { useState } from "react";
import { CheckCircle, Lightbulb, ArrowLeft, Car, Calendar, Users } from "lucide-react";

interface WeddingPackage {
  id: string;
  title: string;
  durationDays: number;
  totalRidesIncluded: number;
  quotedPrice: number;
  driverName: string;
  vehicleType: string;
  eventVillage?: string;
}

const PACKAGES: WeddingPackage[] = [
  { id: "1", title: "3-Day Wedding Package",   durationDays: 3, totalRidesIncluded: 20, quotedPrice: 8000, driverName: "Ramesh Patil",  vehicleType: "SUV" },
  { id: "2", title: "2-Day Baraat Transport",   durationDays: 2, totalRidesIncluded: 15, quotedPrice: 5500, driverName: "Suresh Yadav",  vehicleType: "SUV" },
  { id: "3", title: "1-Day Guest Shuttle",      durationDays: 1, totalRidesIncluded: 10, quotedPrice: 2800, driverName: "Vijay Shinde",  vehicleType: "SUV" },
];

export default function WeddingPage() {
  const [tab, setTab] = useState<"browse" | "create">("browse");
  const [title, setTitle] = useState("");
  const [days, setDays] = useState("3");
  const [rides, setRides] = useState("20");
  const [price, setPrice] = useState("");
  const [village, setVillage] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const createPackage = async () => {
    if (!title || !price) return;
    setCreating(true);
    try {
      await fetch("/api/wedding-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, durationDays: parseInt(days), totalRidesIncluded: parseInt(rides), quotedPrice: parseFloat(price), eventVillage: village }),
      });
      setCreated(true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream pb-8">
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <a href="/" className="flex items-center gap-1.5 text-brand-green-pale text-sm mb-3">
          <ArrowLeft size={14} /> Home
        </a>
        <h1 className="text-xl font-bold">Wedding Transport</h1>
        <p className="text-brand-green-pale text-sm mt-0.5">Multi-day packages · Baraat · Guest pickup</p>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        {(["browse", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === t ? "text-brand-green border-b-2 border-brand-green" : "text-gray-400"
            }`}
          >
            {t === "browse" ? "Browse Packages" : "I'm a Driver — Create Package"}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {tab === "browse" ? (
          <>
            <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-4 flex items-start gap-3">
              <Calendar size={18} className="text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Planning a wedding?</p>
                <p className="text-xs text-gray-500 mt-1">
                  Book a trusted local driver for your entire wedding — baraat, guests, return trips.
                  One price, multiple days, complete peace of mind.
                </p>
              </div>
            </div>

            {PACKAGES.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden card-hover">
                <div className="bg-brand-green-pale px-4 py-3 flex items-center gap-2">
                  <Car size={14} className="text-brand-green" />
                  <p className="text-sm font-bold text-brand-green">{pkg.title}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { val: pkg.durationDays, label: "Days" },
                      { val: pkg.totalRidesIncluded, label: "Rides" },
                      { val: `₹${pkg.quotedPrice.toLocaleString("en-IN")}`, label: "Total", green: true },
                    ].map(({ val, label, green }) => (
                      <div key={label}>
                        <p className={`text-lg font-bold ${green ? "text-brand-green" : "text-gray-700"}`}>{val}</p>
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{pkg.driverName}</p>
                      <p className="text-xs text-gray-400">{pkg.vehicleType}</p>
                    </div>
                    <button className="bg-brand-green text-white px-4 py-2 rounded-xl text-sm font-semibold">
                      Book Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : created ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-brand-green-pale rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
            <h2 className="text-xl font-bold text-brand-green mt-2">Package Created!</h2>
            <p className="text-gray-500 text-sm mt-2">
              Families will see your wedding package when they search for transport.
            </p>
            <button
              onClick={() => { setCreated(false); setTitle(""); setPrice(""); setVillage(""); }}
              className="mt-6 w-full border-2 border-brand-green text-brand-green py-3 rounded-xl font-semibold"
            >
              Create Another Package
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-brand-green-pale border border-brand-green/20 rounded-2xl p-4 flex items-start gap-3">
              <Lightbulb size={16} className="text-brand-green shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-green">Wedding packages = guaranteed income</p>
                <p className="text-xs text-gray-600 mt-1">
                  A 3-day wedding package at ₹8,000 earns more than 40 individual rides.
                  Create a package, families book you for the whole event.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Package Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 3-Day Wedding Transport, Akola District"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Duration (days)</label>
                  <select value={days} onChange={(e) => setDays(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Total Rides</label>
                  <input type="number" value={rides} onChange={(e) => setRides(e.target.value)} placeholder="20"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Your Package Price (₹)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 8000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">Area / Village (optional)</label>
                <input type="text" value={village} onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Wardha district, near Hinganghat"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
            </div>

            <button
              onClick={createPackage}
              disabled={creating || !title || !price}
              className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Wedding Package"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
