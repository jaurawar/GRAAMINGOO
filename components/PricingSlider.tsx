"use client";

import { useState, useCallback } from "react";
import { formatFare, fareDeviation } from "@/lib/pricing";
import { Lightbulb, Check } from "lucide-react";

interface PricingSliderProps {
  systemFare: number;
  minFare: number;
  maxFare: number;
  vehicleType: string;
  onFareChange?: (fare: number) => void;
  onConfirm?: (fare: number) => void;
  disabled?: boolean;
}

export function PricingSlider({
  systemFare, minFare, maxFare, vehicleType,
  onFareChange, onConfirm, disabled = false,
}: PricingSliderProps) {
  const [selectedFare, setSelectedFare] = useState(systemFare);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSelectedFare(val);
    onFareChange?.(val);
  }, [onFareChange]);

  const deviation = fareDeviation(selectedFare, systemFare);
  const isAbove = selectedFare > systemFare;
  const isBelow = selectedFare < systemFare;
  const isSystem = selectedFare === systemFare;
  const sliderPercent = ((selectedFare - minFare) / (maxFare - minFare)) * 100;

  const fareColor = isAbove ? "#d97706" : isBelow ? "#2D6A4F" : "#374151";
  const trackColor = isAbove
    ? `linear-gradient(to right, #fbbf24 ${sliderPercent}%, #fef3c7 ${sliderPercent}%)`
    : `linear-gradient(to right, #40916C ${sliderPercent}%, #d8f3dc ${sliderPercent}%)`;

  return (
    <div className="w-full bg-gradient-card rounded-3xl border border-earth-100 shadow-card-md overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-brand-100 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">
            Your Fare
          </p>
          <p className="text-[10px] text-brand-400 mt-0.5">{vehicleType} · ±15% band</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400">Platform rate</p>
          <p className="text-sm font-bold text-brand-500">{formatFare(systemFare)}</p>
        </div>
      </div>

      <div className="p-5">
        {/* Big fare display */}
        <div className="flex items-end gap-3 mb-6">
          <p
            className="text-5xl font-bold leading-none transition-all duration-150"
            style={{ color: fareColor }}
          >
            {formatFare(selectedFare)}
          </p>
          <div className="pb-1.5">
            {!isSystem && (
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                  isAbove
                    ? "bg-saffron-100 text-saffron-600"
                    : "bg-brand-100 text-brand-500"
                }`}
              >
                {deviation}
              </span>
            )}
            {isSystem && (
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
                <Check size={11} /> Suggested
              </span>
            )}
          </div>
        </div>

        {/* Slider track */}
        <div className="relative mb-2">
          {/* Suggested fare tick */}
          <div
            className="absolute top-0 w-0.5 h-full bg-brand-300 opacity-50 pointer-events-none z-10"
            style={{ left: "50%" }}
          />
          <input
            type="range"
            min={minFare} max={maxFare} step={5}
            value={selectedFare}
            onChange={handleChange}
            disabled={disabled}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed relative z-20"
            style={{ background: trackColor }}
          />
        </div>

        {/* Range labels */}
        <div className="flex justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-gray-600">{formatFare(minFare)}</p>
            <p className="text-[10px] text-gray-400">Min −15%</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-brand-500">{formatFare(systemFare)}</p>
            <p className="text-[10px] text-brand-400">Suggested</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-600">{formatFare(maxFare)}</p>
            <p className="text-[10px] text-gray-400">Max +15%</p>
          </div>
        </div>

        {/* Context tip */}
        <div
          className={`rounded-2xl px-4 py-2.5 mb-4 ${
            isBelow ? "bg-brand-50 border border-brand-100" : isAbove ? "bg-saffron-50 border border-saffron-100" : "bg-earth-50 border border-earth-100"
          }`}
        >
          <p className={`text-xs font-medium leading-relaxed ${isAbove ? "text-saffron-700" : isBelow ? "text-brand-600" : "text-gray-600"}`}>
            {isBelow ? (
              <><Lightbulb size={12} className="inline mr-1 shrink-0" />Below suggested — may attract more passengers quickly.</>
            ) : isAbove ? (
              <><Lightbulb size={12} className="inline mr-1 shrink-0" />Above suggested — fair for difficult roads or extra distance.</>
            ) : (
              <><Check size={12} className="inline mr-1 shrink-0" />At platform suggested rate — balanced for passenger and driver.</>
            )}
          </p>
        </div>

        {/* Confirm button */}
        {onConfirm && (
          <button
            onClick={() => onConfirm(selectedFare)}
            disabled={disabled}
            className={`w-full py-4 rounded-2xl font-bold text-base btn-press transition-all shadow-card-md ${
              isAbove
                ? "bg-gradient-saffron text-white shadow-glow-saffron"
                : "bg-gradient-brand text-white shadow-glow-green"
            } disabled:opacity-50`}
          >
            {disabled ? "Submitting..." : `Quote ${formatFare(selectedFare)} to Passenger`}
          </button>
        )}
      </div>
    </div>
  );
}
