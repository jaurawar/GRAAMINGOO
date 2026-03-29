"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PricingSlider } from "@/components/PricingSlider";
import { DualFareDisplay } from "@/components/DualFareDisplay";
import { formatFare } from "@/lib/pricing";
import {
  MapPin, Flag, IndianRupee, Settings, Wifi, WifiOff, Wheat,
} from "lucide-react";

interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  vehicleType: string;
  systemFare: number;
  minFare: number;
  maxFare: number;
  rideType: string;
  isEmergency: boolean;
  createdAt: string;
}

export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isAvailable, setIsAvailable] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [quotedFare, setQuotedFare] = useState<number | null>(null);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?driver=1");
  }, [status, router]);

  useEffect(() => {
    if (!isAvailable) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/rides?driver=1&status=REQUESTED");
        if (res.ok) {
          const data = await res.json();
          setRideRequests(data.rides ?? []);
        }
      } catch {/* non-critical */}
    }, 10000);
    return () => clearInterval(poll);
  }, [isAvailable]);

  useEffect(() => {
    if (!isAvailable || !navigator.geolocation) return;
    const updateLoc = () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await fetch("/api/drivers/location", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      });
    };
    updateLoc();
    const interval = setInterval(updateLoc, 30000);
    return () => clearInterval(interval);
  }, [isAvailable]);

  const toggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      await fetch("/api/drivers/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });
      setIsAvailable((v) => !v);
    } finally {
      setTogglingAvail(false);
    }
  };

  const acceptRide = async (ride: RideRequest, fare: number) => {
    setQuoting(true);
    try {
      const res = await fetch(`/api/rides/${ride.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedFare: fare }),
      });
      if (res.ok) {
        setRideRequests((prev) => prev.filter((r) => r.id !== ride.id));
        setActiveRequest(null);
      }
    } finally {
      setQuoting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <p className="text-brand-green">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream pb-8">
      {/* Header */}
      <div className="bg-brand-green text-white px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Driver Dashboard</h1>
            <p className="text-brand-green-pale text-sm mt-0.5 flex items-center gap-1.5">
              {session?.user?.name?.split(" ")[0]}
              <Wheat size={12} className="text-brand-green-pale" />
              Graamin Go
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            disabled={togglingAvail}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              isAvailable
                ? "bg-white text-brand-green"
                : "bg-brand-green-light text-white border border-white"
            }`}
          >
            {isAvailable
              ? <><Wifi size={13} /> Online</>
              : <><WifiOff size={13} /> Go Online</>}
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* Status card */}
        <div className={`rounded-2xl p-4 ${isAvailable ? "bg-brand-green-pale border border-brand-green" : "bg-white border border-gray-100"}`}>
          <p className={`text-sm font-semibold ${isAvailable ? "text-brand-green" : "text-gray-500"}`}>
            {isAvailable
              ? "You're online — waiting for ride requests"
              : "You're offline — go online to receive rides"}
          </p>
          {isAvailable && (
            <p className="text-xs text-brand-green-light mt-1">Checking for new requests every 10 seconds</p>
          )}
        </div>

        {/* Active ride request */}
        {activeRequest ? (
          <div className="bg-white rounded-2xl border border-brand-green shadow-sm overflow-hidden">
            <div className="bg-brand-green px-4 py-3 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">New Ride Request</p>
              {activeRequest.isEmergency && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">EMERGENCY</span>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-brand-green mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{activeRequest.pickupAddress}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Flag size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700">{activeRequest.dropAddress}</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-gray-500">
                <span>{activeRequest.distanceKm} km</span>
                <span>·</span>
                <span>{activeRequest.vehicleType}</span>
              </div>

              <DualFareDisplay
                systemFare={activeRequest.systemFare}
                minFare={activeRequest.minFare}
                maxFare={activeRequest.maxFare}
                isEmergency={activeRequest.isEmergency}
              />

              {!activeRequest.isEmergency && (
                <PricingSlider
                  systemFare={activeRequest.systemFare}
                  minFare={activeRequest.minFare}
                  maxFare={activeRequest.maxFare}
                  vehicleType={activeRequest.vehicleType}
                  onFareChange={setQuotedFare}
                  onConfirm={(fare) => acceptRide(activeRequest, fare)}
                  disabled={quoting}
                />
              )}

              {activeRequest.isEmergency && (
                <button
                  onClick={() => acceptRide(activeRequest, activeRequest.systemFare + 100)}
                  disabled={quoting}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-bold"
                >
                  Accept Emergency Ride · {formatFare(activeRequest.systemFare + 100)}
                </button>
              )}

              <button onClick={() => setActiveRequest(null)} className="w-full text-gray-400 text-sm py-2">
                Decline
              </button>
            </div>
          </div>
        ) : (
          rideRequests.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                {rideRequests.length} Ride Request{rideRequests.length > 1 ? "s" : ""} Nearby
              </p>
              {rideRequests.map((ride) => (
                <button
                  key={ride.id}
                  onClick={() => { setActiveRequest(ride); setQuotedFare(ride.systemFare); }}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-brand-green transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-green">{ride.distanceKm} km · {ride.vehicleType}</span>
                    <span className="text-sm font-bold text-gray-700">{formatFare(ride.systemFare)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{ride.pickupAddress}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">to {ride.dropAddress}</p>
                  {ride.isEmergency && (
                    <span className="inline-block mt-2 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">Emergency</span>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <a href="/earnings" className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center gap-2 card-hover">
            <div className="w-10 h-10 rounded-xl bg-brand-green-pale flex items-center justify-center">
              <IndianRupee size={18} className="text-brand-green" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Earnings</p>
          </a>
          <a href="/pricing" className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center gap-2 card-hover">
            <div className="w-10 h-10 rounded-xl bg-earth-100 flex items-center justify-center">
              <Settings size={18} className="text-earth-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Pricing Settings</p>
          </a>
        </div>
      </div>
    </main>
  );
}
