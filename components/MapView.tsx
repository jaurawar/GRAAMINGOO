"use client";

import { useEffect, useRef } from "react";

export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
  color?: "green" | "orange";
}

interface MapViewProps {
  pins?: MapPin[];
  polyline?: [number, number][];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

// Default center: central India
const DEFAULT_CENTER: [number, number] = [22.5, 78.5];
const DEFAULT_ZOOM = 6;

// Leaflet needs to be imported client-side only (uses window)
export function MapView({
  pins = [],
  polyline = [],
  center,
  zoom,
  className = "w-full h-64 rounded-2xl overflow-hidden",
  onMapClick,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const polylineRef = useRef<import("leaflet").Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import("leaflet");
    (async () => {
      L = (await import("leaflet")).default;
      // Fix Leaflet's broken default icon paths in webpack/Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: center ?? DEFAULT_CENTER,
        zoom: zoom ?? DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));
      }

      mapRef.current = map;
      renderPins(L, map);
      renderPolyline(L, map);
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pins when they change
  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      renderPins(L, mapRef.current!);
      renderPolyline(L, mapRef.current!);

      // Auto-fit bounds when we have 2 pins
      if (pins.length >= 2) {
        const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
        mapRef.current!.fitBounds(bounds, { padding: [40, 40] });
      } else if (pins.length === 1) {
        mapRef.current!.setView([pins[0].lat, pins[0].lng], 13);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins, polyline]);

  function renderPins(L: typeof import("leaflet"), map: import("leaflet").Map) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = pins.map((pin) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:${pin.color === "orange" ? "#f59e0b" : "#2D6A4F"};
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          transform:rotate(-45deg);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      });
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      if (pin.label) marker.bindPopup(pin.label);
      return marker;
    });
  }

  function renderPolyline(L: typeof import("leaflet"), map: import("leaflet").Map) {
    polylineRef.current?.remove();
    if (polyline.length > 1) {
      polylineRef.current = L.polyline(polyline, {
        color: "#2D6A4F",
        weight: 4,
        opacity: 0.75,
        dashArray: "8 4",
      }).addTo(map);
    }
  }

  return (
    <>
      {/* Leaflet CSS loaded inline — avoids needing a separate import in _app */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={containerRef} className={className} />
    </>
  );
}

/** Dynamic wrapper — use this in pages instead of MapView directly */
export { MapView as default };
