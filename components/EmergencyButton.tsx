"use client";

import { useState, useRef } from "react";
import { Siren, Hospital } from "lucide-react";

interface EmergencyButtonProps {
  rideId?: string;
  onEmergency?: () => void;
  size?: "sm" | "lg";
}

export function EmergencyButton({ rideId, onEmergency, size = "lg" }: EmergencyButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleActivate = async () => {
    setLoading(true);
    try {
      if (rideId) {
        await fetch(`/api/rides/${rideId}/emergency`, { method: "POST" });
      }
      setActivated(true);
      onEmergency?.();
    } catch {
      console.error("Emergency activation failed");
    } finally {
      setLoading(false);
      setHolding(false);
    }
  };

  const startHold = () => {
    if (activated || loading) return;
    setHolding(true);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current!);
          handleActivate();
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  const cancelHold = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  };

  if (size === "sm") {
    return (
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        disabled={activated || loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all btn-press ${
          activated
            ? "bg-danger-600 text-white shadow-glow-red"
            : "bg-danger-50 text-danger-600 border-2 border-danger-200"
        }`}
      >
        <Siren size={12} strokeWidth={2.5} />
        {activated ? "Emergency Active" : "SOS"}
      </button>
    );
  }

  return (
    <div className="w-full space-y-2 animate-fade-up">
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        disabled={activated || loading}
        className={`relative w-full overflow-hidden rounded-3xl font-bold text-base transition-all select-none
          ${activated
            ? "bg-gradient-emergency text-white shadow-glow-red py-4"
            : "border-2 border-danger-300 bg-danger-50 text-danger-600 py-4 btn-press"
          }
        `}
        style={{ userSelect: "none", touchAction: "none" }}
      >
        {/* Progress fill bar */}
        {holding && !activated && (
          <div
            className="absolute inset-0 bg-gradient-emergency origin-left"
            style={{
              width: `${progress}%`,
              opacity: 0.25,
              transition: "width 0.08s linear",
            }}
          />
        )}

        {/* Button ring pulse when holding */}
        {holding && !activated && (
          <div className="absolute inset-0 rounded-3xl border-2 border-danger-400 animate-pulse-ring pointer-events-none" />
        )}

        <span className="relative z-10 flex items-center justify-center gap-3">
          <Siren
            size={24}
            strokeWidth={2}
            className={holding ? "animate-bounce-gentle" : ""}
          />
          <span className="font-bold">
            {activated
              ? "Emergency Active — Fare Locked"
              : loading
              ? "Activating..."
              : holding
              ? `Hold... ${progress}%`
              : "Emergency Ride — Hold 2s to Activate"}
          </span>
        </span>
      </button>

      {!activated && (
        <p className="text-center text-[11px] text-gray-400 font-medium">
          Hold 2 seconds · Fare locked at system rate + ₹100 · Family & PHC alerted instantly
        </p>
      )}

      {activated && (
        <div className="bg-danger-50 border border-danger-200 rounded-2xl px-4 py-3 animate-fade-up">
          <div className="flex items-start gap-3">
            <Hospital size={22} className="text-danger-500 mt-0.5 shrink-0" strokeWidth={2} />
            <div>
              <p className="text-sm font-bold text-danger-700">Emergency ride activated</p>
              <ul className="mt-1 space-y-0.5">
                <li className="text-xs text-danger-600">Fare locked — no driver can negotiate</li>
                <li className="text-xs text-danger-600">Your family witness has been alerted via SMS</li>
                <li className="text-xs text-danger-600">Nearest health centre notified</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
