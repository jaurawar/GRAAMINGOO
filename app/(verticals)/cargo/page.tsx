"use client";

import { useState } from "react";
import { Wheat, Package, Settings, CheckCircle, ArrowLeft } from "lucide-react";

const CARGO_TYPES = [
  { type: "PRODUCE",   icon: Wheat,    label: "Farm Produce",   desc: "Vegetables, grains, fruits — farm to mandi" },
  { type: "GOODS",     icon: Package,  label: "General Goods",  desc: "Supplies, household items" },
  { type: "EQUIPMENT", icon: Settings, label: "Farm Equipment", desc: "Tools, machinery parts" },
] as const;

type CargoType = "PRODUCE" | "GOODS" | "EQUIPMENT";

export default function CargoPage() {
  const [cargoType, setCargoType] = useState<CargoType>("PRODUCE");
  const [pickup, setPickup] = useState("");
  const [mandiName, setMandiName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  const handleBook = async () => {
    if (!pickup || !mandiName) { setError("Please fill in pickup and destination mandi"); return; }
    setBooking(true); setError("");
    try {
      const rideRes = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType: "TEMPO", rideType: "CARGO",
          pickupLat: 0, pickupLng: 0, pickupAddress: pickup,
          dropLat: 0, dropLng: 0, dropAddress: mandiName,
          distanceKm: 20,
        }),
      });
      if (!rideRes.ok) throw new Error();
      const ride = await rideRes.json();
      await fetch("/api/cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: ride.id, cargoType, weightKg: weightKg ? parseFloat(weightKg) : null, mandiName, notes }),
      });
      setBooked(true);
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (booked) {
    return (
      <main className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-brand-green-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-brand-green" />
          </div>
          <h2 className="text-xl font-bold text-brand-green mt-4">Cargo Ride Requested!</h2>
          <p className="text-gray-500 text-sm mt-2">
            Finding a tempo driver near you for the farm-to-mandi run.
          </p>
          <button
            onClick={() => { setBooked(false); setPickup(""); setMandiName(""); setWeightKg(""); setNotes(""); }}
            className="mt-6 w-full border-2 border-brand-green text-brand-green py-3 rounded-xl font-semibold"
          >
            Book Another Cargo Ride
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream pb-8">
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <a href="/" className="flex items-center gap-1.5 text-brand-green-pale text-sm mb-3">
          <ArrowLeft size={14} /> Home
        </a>
        <h1 className="text-xl font-bold">Graamin Cargo</h1>
        <p className="text-brand-green-pale text-sm mt-0.5">Farm-to-Mandi transport · Kisan Haul</p>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-4 flex items-start gap-3">
          <Wheat size={18} className="text-saffron-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Stop losing crops to transport delays</p>
            <p className="text-xs text-gray-500 mt-1">
              Book a trusted tempo driver for your farm produce. Transparent fare.
              Driver you know from your village area.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">What are you sending?</p>
          <div className="space-y-2">
            {CARGO_TYPES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.type}
                  onClick={() => setCargoType(c.type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    cargoType === c.type ? "border-brand-green bg-brand-green-pale" : "border-gray-100 bg-white"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cargoType === c.type ? "bg-brand-green" : "bg-gray-100"}`}>
                    <Icon size={18} className={cargoType === c.type ? "text-white" : "text-gray-500"} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${cargoType === c.type ? "text-brand-green" : "text-gray-700"}`}>{c.label}</p>
                    <p className="text-xs text-gray-400">{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          {[
            { label: "Pickup — farm / village location", value: pickup, set: setPickup, placeholder: "e.g. Rajpur village farm, Wardha" },
            { label: "Destination — Mandi / Market",     value: mandiName, set: setMandiName, placeholder: "e.g. Yavatmal APMC Mandi" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">{label}</label>
              <input
                type="text" value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Approximate weight (kg) — optional</label>
            <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 500"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Notes — optional</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions..." rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">Tempo Rate</p>
          <p className="text-base font-bold text-gray-700">₹20/km</p>
          <p className="text-xs text-gray-400 mt-0.5">Driver may quote ±15% of platform rate</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={booking || !pickup || !mandiName}
          className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50"
        >
          {booking ? "Finding Tempo Driver..." : "Find a Tempo Driver"}
        </button>

        <p className="text-center text-xs text-gray-400">Tempo drivers with cargo experience shown first · ±15% fare band applies</p>
      </div>
    </main>
  );
}
