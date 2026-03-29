"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader, X } from "lucide-react";
import { geocodeSearch, type GeoResult } from "@/lib/geocode";

interface LocationSearchProps {
  placeholder?: string;
  value: string;
  onSelect: (result: GeoResult) => void;
  onClear?: () => void;
  dotColor?: "green" | "orange";
}

export function LocationSearch({
  placeholder = "Search location...",
  value,
  onSelect,
  onClear,
  dotColor = "green",
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value resets
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setLoading(true);
    const res = await geocodeSearch(q);
    setResults(res);
    setLoading(false);
    setOpen(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 400);
  };

  const handleSelect = (result: GeoResult) => {
    // Use short display name (first two comma-separated parts)
    const short = result.displayName.split(",").slice(0, 2).join(", ");
    setQuery(short);
    setOpen(false);
    setResults([]);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear?.();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dotClass = dotColor === "orange"
    ? "bg-saffron-400"
    : "bg-brand-400";

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300 font-medium"
        />
        {loading && <Loader size={13} className="text-gray-300 animate-spin shrink-0" />}
        {!loading && query && (
          <button onClick={handleClear} className="text-gray-300 hover:text-gray-400 shrink-0">
            <X size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-card-lg border border-earth-100 z-50 overflow-hidden max-h-56 overflow-y-auto">
          {results.map((r) => {
            const parts = r.displayName.split(",");
            const primary = parts.slice(0, 2).join(", ");
            const secondary = parts.slice(2, 4).join(", ");
            return (
              <li key={r.placeId}>
                <button
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-brand-50 text-left transition-colors"
                  onClick={() => handleSelect(r)}
                >
                  <MapPin size={14} className="text-brand-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-gray-400 truncate">{secondary}</p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
