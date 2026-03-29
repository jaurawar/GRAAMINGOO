"use client";

import { Lock, Hospital } from "lucide-react";
import { formatFare, fareDeviation } from "@/lib/pricing";

interface DualFareDisplayProps {
  systemFare: number;
  driverFare?: number;
  minFare: number;
  maxFare: number;
  isEmergency?: boolean;
  onAccept?: () => void;
  onCounter?: () => void;
  showActions?: boolean;
}

export function DualFareDisplay({
  systemFare,
  driverFare,
  minFare,
  maxFare,
  isEmergency = false,
  onAccept,
  onCounter,
  showActions = false,
}: DualFareDisplayProps) {
  const deviation = driverFare ? fareDeviation(driverFare, systemFare) : null;
  const isAbove = driverFare ? driverFare > systemFare : false;
  const isBelow = driverFare ? driverFare < systemFare : false;
  const sliderPercent = driverFare
    ? Math.min(Math.max(((driverFare - minFare) / (maxFare - minFare)) * 100, 0), 100)
    : 50;

  return (
    <div className="w-full rounded-3xl overflow-hidden shadow-card-md animate-scale-in">
      {/* Emergency banner */}
      {isEmergency && (
        <div className="bg-gradient-emergency px-4 py-2.5 flex items-center gap-2">
          <Lock size={16} strokeWidth={2.5} className="text-white animate-wiggle" />
          <p className="text-white text-xs font-bold tracking-wide uppercase">
            Emergency — Fare Permanently Locked
          </p>
        </div>
      )}

      {/* Header bar */}
      {!isEmergency && (
        <div className="bg-brand-100 px-4 py-2.5 flex items-center justify-between">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">
            Transparent Fare
          </p>
          <span className="text-xs text-brand-400 font-medium">±15% band</span>
        </div>
      )}

      {/* Core fare comparison — the trust layer */}
      <div className="bg-gradient-card grid grid-cols-2 divide-x divide-earth-100">
        {/* System Suggested */}
        <div className="p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Platform Suggests
          </p>
          <p className="text-3xl font-bold text-gray-800 leading-none">
            {formatFare(systemFare)}
          </p>
          <p className="text-[10px] text-gray-400 mt-2 font-medium">
            {formatFare(minFare)} – {formatFare(maxFare)}
          </p>
        </div>

        {/* Driver Quoted */}
        <div className="p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Driver Quotes
          </p>
          {driverFare ? (
            <>
              <p
                className={`text-3xl font-bold leading-none transition-colors ${
                  isAbove ? "text-saffron-600" : isBelow ? "text-brand-500" : "text-gray-800"
                }`}
              >
                {formatFare(driverFare)}
              </p>
              <p
                className={`text-[10px] font-bold mt-2 ${
                  isAbove ? "text-saffron-500" : isBelow ? "text-brand-400" : "text-gray-400"
                }`}
              >
                {deviation} from suggested
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-8 w-20 skeleton rounded-xl" />
              <div className="h-3 w-14 skeleton rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Visual band slider */}
      {!isEmergency && (
        <div className="bg-gradient-card px-5 pb-4">
          <div className="relative h-3 bg-earth-100 rounded-full overflow-hidden">
            {/* Band fill */}
            <div className="absolute inset-0 bg-brand-100 rounded-full" />
            {/* System fare marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-brand-400 opacity-60"
              style={{ left: "50%" }}
            />
            {/* Driver fare dot */}
            {driverFare && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
                  isAbove ? "bg-saffron-400" : "bg-brand-400"
                }`}
                style={{
                  left: `${sliderPercent}%`,
                  transform: `translateX(-50%) translateY(-50%)`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400 font-medium">{formatFare(minFare)} −15%</span>
            <span className="text-[10px] text-brand-500 font-bold">Suggested</span>
            <span className="text-[10px] text-gray-400 font-medium">+15% {formatFare(maxFare)}</span>
          </div>
        </div>
      )}

      {/* Emergency info */}
      {isEmergency && driverFare && (
        <div className="bg-danger-50 px-5 py-3 border-t border-danger-100">
          <div className="flex items-center gap-2">
            <Hospital size={16} className="text-danger-500 shrink-0" strokeWidth={2} />
            <p className="text-xs text-danger-700 font-semibold">
              Locked at {formatFare(driverFare)} · Includes ₹100 emergency fee · No negotiation
            </p>
          </div>
        </div>
      )}

      {/* Accept / Counter actions */}
      {showActions && driverFare && !isEmergency && (
        <div className="bg-surface-0 px-4 pb-4 pt-1 flex gap-2 border-t border-earth-100">
          <button
            onClick={onAccept}
            className="flex-1 bg-gradient-brand text-white py-3 rounded-2xl text-sm font-bold shadow-card hover:shadow-glow-green btn-press transition-all"
          >
            Accept {formatFare(driverFare)}
          </button>
          <button
            onClick={onCounter}
            className="flex-1 border-2 border-brand-300 text-brand-500 py-3 rounded-2xl text-sm font-bold hover:bg-brand-50 btn-press transition-all"
          >
            Counter Offer
          </button>
        </div>
      )}
    </div>
  );
}
