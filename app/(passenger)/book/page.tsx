"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DualFareDisplay } from "@/components/DualFareDisplay";
import { EmergencyButton } from "@/components/EmergencyButton";
import { BottomNav } from "@/components/BottomNav";
import { LocationSearch } from "@/components/LocationSearch";
import type { FareEstimate } from "@/lib/pricing";
import { getRoute, haversineKm, type GeoResult } from "@/lib/geocode";
import {
  Bike, Car, Truck, Search, MessageCircle, CheckCircle,
  AlertTriangle, Wheat, Navigation, Clock,
} from "lucide-react";

// Leaflet uses window — must be dynamically imported
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type VehicleType = "BIKE" | "AUTO" | "SUV" | "TEMPO";

const VEHICLES: {
  type: VehicleType;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
}[] = [
  { type: "BIKE",  icon: Bike,  label: "Bike",  desc: "₹8/km · 1 person",    color: "border-saffron-300 bg-saffron-50" },
  { type: "AUTO",  icon: Car,   label: "Auto",  desc: "₹12/km · 3 people",   color: "border-brand-300 bg-brand-50" },
  { type: "SUV",   icon: Car,   label: "SUV",   desc: "₹16/km · 6 people",   color: "border-earth-300 bg-earth-50" },
  { type: "TEMPO", icon: Truck, label: "Tempo", desc: "₹20/km · Cargo/Group", color: "border-gray-300 bg-gray-50" },
];

const NEXT_STEPS = [
  { icon: Search,        text: "Drivers near you see your request" },
  { icon: MessageCircle, text: "Driver quotes their fare (±15% of platform rate)" },
  { icon: CheckCircle,   text: "You accept or counter-offer" },
  { icon: Car,           text: "Ride starts — your family is alerted" },
];

export default function BookPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pickupResult, setPickupResult] = useState<GeoResult | null>(null);
  const [dropResult, setDropResult] = useState<GeoResult | null>(null);
  const [pickupValue, setPickupValue] = useState("");
  const [dropValue, setDropValue] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("AUTO");
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookedRideId, setBookedRideId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Recalculate route + fare whenever both points change
  const recalcRoute = useCallback(async (
    from: GeoResult, to: GeoResult, vehicle: VehicleType
  ) => {
    // Try OSRM first for real driving distance
    const route = await getRoute(from.lat, from.lng, to.lat, to.lng);
    const km = route ? route.distanceKm : haversineKm(from.lat, from.lng, to.lat, to.lng) * 1.3;
    if (route) {
      setRoutePolyline(route.polyline);
      setDurationMin(route.durationMin);
    } else {
      setRoutePolyline([]);
      setDurationMin(null);
    }
    setDistanceKm(km);
    // Fetch fare for this vehicle + distance
    const res = await fetch(`/api/pricing?vehicle_type=${vehicle}&distance=${km.toFixed(1)}`);
    if (res.ok) setFareEstimate(await res.json());
  }, []);

  useEffect(() => {
    if (pickupResult && dropResult) {
      recalcRoute(pickupResult, dropResult, vehicleType);
    } else if (!pickupResult || !dropResult) {
      // Fallback fare preview for selected vehicle at default distance
      fetch(`/api/pricing?vehicle_type=${vehicleType}&distance=15`)
        .then((r) => r.json())
        .then(setFareEstimate)
        .catch(() => {});
      setRoutePolyline([]);
      setDistanceKm(null);
      setDurationMin(null);
    }
  }, [pickupResult, dropResult, vehicleType, recalcRoute]);

  const handleBook = async () => {
    if (!pickupResult || !dropResult) { setError("Select pickup and destination from the suggestions"); return; }
    setBooking(true); setError("");
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType, rideType: "STANDARD",
          pickupLat: pickupResult.lat,
          pickupLng: pickupResult.lng,
          pickupAddress: pickupResult.displayName.split(",").slice(0, 3).join(", "),
          dropLat: dropResult.lat,
          dropLng: dropResult.lng,
          dropAddress: dropResult.displayName.split(",").slice(0, 3).join(", "),
          distanceKm: distanceKm ?? 15,
        }),
      });
      if (!res.ok) throw new Error();
      const ride = await res.json();
      setBookedRideId(ride.id);
    } catch {
      setError("Booking failed. Try again or use WhatsApp.");
    } finally {
      setBooking(false);
    }
  };

  const mapPins = [
    ...(pickupResult ? [{ lat: pickupResult.lat, lng: pickupResult.lng, label: "Pickup", color: "green" as const }] : []),
    ...(dropResult ? [{ lat: dropResult.lat, lng: dropResult.lng, label: "Drop", color: "orange" as const }] : []),
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-earth">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center animate-pulse-ring">
            <Wheat size={22} className="text-white" />
          </div>
          <p className="text-brand-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (bookedRideId) {
    return (
      <main className="min-h-screen bg-gradient-earth flex flex-col items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
              <CheckCircle size={40} className="text-brand-green" />
            </div>
            <h2 className="text-2xl font-bold text-brand-600">Ride Requested!</h2>
            <p className="text-gray-500 text-sm mt-2">
              Finding a driver near you. They will quote their fare shortly.
            </p>
          </div>

          <div className="glass rounded-3xl p-5 shadow-card-md text-center animate-fade-up" style={{ animationDelay: "100ms" }}>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">Ride ID</p>
            <p className="font-mono font-bold text-2xl text-gray-800 tracking-widest">
              {bookedRideId.slice(-6).toUpperCase()}
            </p>
            <p className="text-xs text-gray-400 mt-2">Show this to your driver</p>
          </div>

          <div className="bg-surface-0 rounded-3xl p-5 border border-earth-100 shadow-card animate-fade-up" style={{ animationDelay: "200ms" }}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">What happens next</p>
            {NEXT_STEPS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 rounded-lg bg-brand-green-pale flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-brand-green" />
                </div>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          <EmergencyButton rideId={bookedRideId} />

          <button
            onClick={() => {
              setBookedRideId(null);
              setPickupResult(null); setDropResult(null);
              setPickupValue(""); setDropValue("");
            }}
            className="w-full text-brand-500 text-sm font-semibold py-3 btn-press"
          >
            Book another ride
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-earth pb-28">
      <div className="bg-gradient-brand-dark px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="relative z-10">
          <p className="text-brand-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Hello, {session?.user?.name?.split(" ")[0] ?? "Traveler"}
          </p>
          <h1 className="text-2xl font-bold text-white">Where to?</h1>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 max-w-md mx-auto">
        {/* Location card with Nominatim search */}
        <div className="glass rounded-3xl p-4 shadow-card-lg animate-fade-up">
          <div className="space-y-3">
            <LocationSearch
              placeholder="Your village or pickup point"
              value={pickupValue}
              dotColor="green"
              onSelect={(r) => { setPickupResult(r); setPickupValue(r.displayName.split(",").slice(0, 2).join(", ")); }}
              onClear={() => { setPickupResult(null); setPickupValue(""); }}
            />
            <div className="border-t border-earth-100" />
            <LocationSearch
              placeholder="Hospital, mandi, town..."
              value={dropValue}
              dotColor="orange"
              onSelect={(r) => { setDropResult(r); setDropValue(r.displayName.split(",").slice(0, 2).join(", ")); }}
              onClear={() => { setDropResult(null); setDropValue(""); }}
            />
          </div>
        </div>

        {/* Map — always shown, zooms to pins when set */}
        <div className="animate-fade-up rounded-2xl overflow-hidden shadow-card border border-earth-100" style={{ animationDelay: "40ms" }}>
          <MapView
            pins={mapPins}
            polyline={routePolyline}
            className="w-full h-52"
          />
          {distanceKm !== null && (
            <div className="bg-white px-4 py-2.5 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                <Navigation size={13} />
                {distanceKm.toFixed(1)} km
              </div>
              {durationMin !== null && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock size={13} />
                  ~{durationMin} min
                </div>
              )}
              <p className="text-xs text-gray-400 ml-auto">via road (OSRM)</p>
            </div>
          )}
        </div>

        {/* Vehicle type */}
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">Choose Vehicle</p>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLES.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.type}
                  onClick={() => setVehicleType(v.type)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 btn-press card-hover ${
                    vehicleType === v.type
                      ? `${v.color} shadow-card scale-[1.02]`
                      : "border-earth-100 bg-surface-0"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${vehicleType === v.type ? "bg-white/60" : "bg-gray-50"}`}>
                    <Icon size={18} className={vehicleType === v.type ? "text-brand-600" : "text-gray-400"} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${vehicleType === v.type ? "text-brand-600" : "text-gray-700"}`}>
                      {v.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{v.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {fareEstimate && (
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
              Fare Estimate{distanceKm ? ` · ${distanceKm.toFixed(1)} km` : " · ~15 km"}
            </p>
            <DualFareDisplay
              systemFare={fareEstimate.systemFare}
              minFare={fareEstimate.minFare}
              maxFare={fareEstimate.maxFare}
            />
          </div>
        )}

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl px-4 py-3 animate-fade-in flex items-center gap-2">
            <AlertTriangle size={15} className="text-danger-500 shrink-0" />
            <p className="text-danger-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <EmergencyButton />
        </div>

        <button
          onClick={handleBook}
          disabled={booking || !pickupResult || !dropResult}
          className="w-full bg-gradient-brand text-white py-4 rounded-2xl font-bold text-base shadow-glow-green shadow-card-md btn-press hover:shadow-lg transition-all disabled:opacity-50 animate-fade-up"
          style={{ animationDelay: "220ms" }}
        >
          {booking ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Finding Drivers...
            </span>
          ) : "Find a Driver →"}
        </button>

        <p className="text-center text-[11px] text-gray-400 pb-4">
          No internet? Book via WhatsApp · Works on 2G
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
