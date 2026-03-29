"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PricingSlider } from "@/components/PricingSlider";
import { getFareEstimate } from "@/lib/pricing";
import { ArrowLeft, Bike, Car, Truck, Info, CheckCircle } from "lucide-react";

type VehicleType = "BIKE" | "AUTO" | "SUV" | "TEMPO";

const VEHICLES: { type: VehicleType; icon: React.ElementType; label: string; baseRate: number }[] = [
  { type: "BIKE",  icon: Bike,  label: "Bike",  baseRate: 8  },
  { type: "AUTO",  icon: Car,   label: "Auto",  baseRate: 12 },
  { type: "SUV",   icon: Car,   label: "SUV",   baseRate: 16 },
  { type: "TEMPO", icon: Truck, label: "Tempo", baseRate: 20 },
];

const DISTANCES = [5, 10, 15, 20, 30];

export default function PricingSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<VehicleType>("AUTO");
  const [distance, setDistance] = useState(15);
  const [savedFare, setSavedFare] = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?driver=1");
  }, [status, router]);

  const vInfo = VEHICLES.find((v) => v.type === vehicle)!;
  const estimate = getFareEstimate(vehicle, distance);

  const handleConfirm = (fare: number) => {
    setSavedFare(fare);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <p className="text-brand-green text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream pb-10">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-brand-green-pale text-sm mb-3"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
        <h1 className="text-xl font-bold">Pricing Settings</h1>
        <p className="text-brand-green-pale text-sm mt-0.5">
          Set your preferred fare within the platform band
        </p>
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-md mx-auto">

        {/* Info banner */}
        <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-4 flex items-start gap-3">
          <Info size={16} className="text-saffron-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">How fare bands work</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              The platform sets a suggested fare. You can quote ±15% of that rate for any ride.
              Passengers see both the system rate and your quoted rate — transparency builds trust.
            </p>
          </div>
        </div>

        {/* Vehicle selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Your Vehicle</p>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLES.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.type}
                  onClick={() => setVehicle(v.type)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all btn-press ${
                    vehicle === v.type
                      ? "border-brand-400 bg-brand-50"
                      : "border-earth-100 bg-white"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${vehicle === v.type ? "bg-brand-100" : "bg-gray-50"}`}>
                    <Icon size={18} className={vehicle === v.type ? "text-brand-600" : "text-gray-400"} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${vehicle === v.type ? "text-brand-600" : "text-gray-700"}`}>
                      {v.label}
                    </p>
                    <p className="text-[10px] text-gray-400">₹{v.baseRate}/km</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distance preview selector */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
            Preview for distance
          </p>
          <div className="flex gap-2 flex-wrap">
            {DISTANCES.map((d) => (
              <button
                key={d}
                onClick={() => setDistance(d)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all btn-press ${
                  distance === d
                    ? "bg-brand-green text-white border-brand-green"
                    : "bg-white text-gray-600 border-earth-200"
                }`}
              >
                {d} km
              </button>
            ))}
          </div>
        </div>

        {/* Pricing slider */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
            {vInfo.label} · {distance} km trip
          </p>
          <PricingSlider
            systemFare={estimate.systemFare}
            minFare={estimate.minFare}
            maxFare={estimate.maxFare}
            vehicleType={vInfo.label}
            onConfirm={handleConfirm}
          />
        </div>

        {/* Saved confirmation */}
        {showSaved && savedFare !== null && (
          <div className="bg-brand-green-pale border border-brand-green rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
            <CheckCircle size={18} className="text-brand-green shrink-0" />
            <p className="text-sm font-semibold text-brand-green">
              Preference saved — you will quote ₹{savedFare} for this distance
            </p>
          </div>
        )}

        {/* Commission breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Commission rates</p>
          <div className="space-y-2">
            {[
              { label: "Premium subscription", rate: "0%", note: "₹499/month flat" },
              { label: "50+ rides this month", rate: "5%", note: "High volume discount" },
              { label: "Return trip match", rate: "3%", note: "Same-route return" },
              { label: "Standard (free plan)", rate: "8%", note: "Default" },
            ].map(({ label, rate, note }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{note}</p>
                </div>
                <span className="text-sm font-bold text-brand-green">{rate}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
