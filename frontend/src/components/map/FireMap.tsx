"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSONFeatureCollection, HarmonizedCell, NasaEvent } from "@/lib/types";
import { Layers, Info, Compass, ChevronDown, ChevronUp } from "lucide-react";

interface FireMapProps {
  hotspotsData: GeoJSONFeatureCollection;
  harmonizedCells?: HarmonizedCell[];
  nasaEvents?: NasaEvent[];
  initialLat?: number;
  initialLon?: number;
  initialZoom?: number;
}

export default function FireMap({
  hotspotsData,
  harmonizedCells = [],
  nasaEvents = [],
  initialLat = 22.0,
  initialLon = 78.0,
  initialZoom = 5,
}: FireMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const modisLayerRef = useRef<L.LayerGroup | null>(null);
  const viirsLayerRef = useRef<L.LayerGroup | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const eonetLayerRef = useRef<L.LayerGroup | null>(null);

  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showEonet, setShowEonet] = useState(true);
  const [controlsExpanded, setControlsExpanded] = useState(true);

  // Start layer drawer collapsed on narrow mobile phones to keep map canvas clear
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setControlsExpanded(false);
    }
  }, []);

  // Initialize Map centered on South Asia with key-free OpenStreetMap tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: false,
      minZoom: 3,
      maxZoom: 18,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • NASA FIRMS • NASA EONET',
      maxZoom: 19,
    }).addTo(map);

    const gridGroup = L.layerGroup().addTo(map);
    const modisGroup = L.layerGroup().addTo(map);
    const viirsGroup = L.layerGroup().addTo(map);
    const eonetGroup = L.layerGroup().addTo(map);

    gridLayerRef.current = gridGroup;
    modisLayerRef.current = modisGroup;
    viirsLayerRef.current = viirsGroup;
    eonetLayerRef.current = eonetGroup;
    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialLat, initialLon, initialZoom]);

  // Update Layers when data or toggles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    modisLayerRef.current?.clearLayers();
    viirsLayerRef.current?.clearLayers();
    gridLayerRef.current?.clearLayers();
    eonetLayerRef.current?.clearLayers();

    // 1. Render Harmonized 0.1° Grid Cells (Blue-to-Violet Spectrum)
    if (showGrid && gridLayerRef.current && harmonizedCells.length > 0) {
      harmonizedCells.forEach((cell) => {
        if (
          !Number.isFinite(cell.cell_lat_min) ||
          !Number.isFinite(cell.cell_lon_min) ||
          !Number.isFinite(cell.cell_lat_max) ||
          !Number.isFinite(cell.cell_lon_max)
        ) {
          return;
        }
        const bounds: L.LatLngBoundsExpression = [
          [cell.cell_lat_min, cell.cell_lon_min],
          [cell.cell_lat_max, cell.cell_lon_max],
        ];

        const score = cell.hai_score ?? 0;
        let strokeColor = "#0284C7"; // Sky Cyan for Low (< 0.35)
        let fillColor = "#38BDF8";

        if (score > 0.65) {
          strokeColor = "#7C3AED"; // Vivid Violet for High (> 0.65)
          fillColor = "#8B5CF6";
        } else if (score > 0.35) {
          strokeColor = "#2563EB"; // Royal Blue for Moderate (0.35 - 0.65)
          fillColor = "#3B82F6";
        }

        const polygon = L.rectangle(bounds, {
          color: strokeColor,
          weight: 1.8,
          opacity: 0.9,
          fillColor: fillColor,
          fillOpacity: 0.28,
        });

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 195px; padding: 4px; color: #10243A;">
            <div style="font-weight: 800; color: #2563EB; margin-bottom: 6px; border-bottom: 1px solid #E2DEC9; padding-bottom: 4px;">
              Harmonized Grid Cell (0.1°)
            </div>
            <div><strong>Cell ID:</strong> <span style="font-family: monospace;">${cell.grid_cell_id}</span></div>
            <div><strong>HAI Score:</strong> <span style="font-weight: 800; color: ${strokeColor};">${score.toFixed(3)}</span> <small>(Prototype)</small></div>
            <div><strong>MODIS (~1 km):</strong> ${cell.modis_count} detections</div>
            <div><strong>VIIRS (375 m):</strong> ${cell.total_viirs_count} detections</div>
            <div><strong>Combined FRP:</strong> ${(cell.total_frp_modis + cell.total_frp_viirs).toFixed(1)} MW</div>
          </div>
        `;
        polygon.bindPopup(popupContent);
        gridLayerRef.current?.addLayer(polygon);
      });
    }

    // 2. Render Point Hotspots (MODIS = Deep Plum #35063D, VIIRS = Blaze Orange)
    if (showModis || showViirs) {
      hotspotsData?.features?.forEach((feature) => {
        const coords = feature?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return;
        const [lon, lat] = coords;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const p = feature.properties;
        const isModis = p.instrument === "MODIS";

        if (isModis && !showModis) return;
        if (!isModis && !showViirs) return;

        const radius = isModis ? 6.5 : 4.5;
        const fillColor = isModis ? "#35063D" : "#FF6B2B";
        const borderColor = isModis ? "#1A021F" : "#9A3412";

        const marker = L.circleMarker([lat, lon], {
          radius: radius,
          fillColor: fillColor,
          color: borderColor,
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 195px; padding: 4px; color: #10243A;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2DEC9; padding-bottom: 4px;">
              <strong style="color: ${fillColor}; font-size: 13px;">
                ${p.instrument} · ${p.satellite_platform}
              </strong>
              <span style="font-size: 10px; background: #10243A; color: #F7F6EF; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">
                ${p.confidence_category || "nominal"}
              </span>
            </div>
            <div><strong>Coordinates:</strong> ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div>
            <div><strong>Observed:</strong> ${p.acq_date} ${p.acq_time ? p.acq_time + " UTC" : ""}</div>
            <div><strong>Radiative Power (FRP):</strong> <strong style="color: ${fillColor};">${p.frp != null ? Number(p.frp).toFixed(1) + " MW" : "N/A"}</strong></div>
            <div><strong>Brightness Temp:</strong> ${p.brightness != null ? Number(p.brightness).toFixed(1) + " K" : "N/A"}</div>
            <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #E2DEC9; font-size: 11px; color: #4A607A;">
              Official NASA FIRMS satellite thermal anomaly.
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        if (isModis) {
          modisLayerRef.current?.addLayer(marker);
        } else {
          viirsLayerRef.current?.addLayer(marker);
        }
      });
    }

    // 3. Render NASA Events (Emerald Green)
    if (showEonet && eonetLayerRef.current && nasaEvents && nasaEvents.length > 0) {
      nasaEvents.forEach((evt) => {
        if (!Number.isFinite(evt.latitude) || !Number.isFinite(evt.longitude)) return;

        const eonetMarker = L.circleMarker([evt.latitude, evt.longitude], {
          radius: 9.5,
          fillColor: "#10B981",
          color: "#064E3B",
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.92,
        });

        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 220px; padding: 4px; color: #10243A;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2DEC9; padding-bottom: 4px;">
              <strong style="color: #064E3B; font-size: 13px;">NASA Official Event</strong>
              <span style="font-size: 10px; background: #10B981; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">
                ${evt.status || "open"}
              </span>
            </div>
            <div style="font-weight: 800; font-size: 12px; color: #10243A; margin-bottom: 4px;">
              ${evt.title}
            </div>
            <div><strong>Event ID:</strong> <span style="font-family: monospace;">${evt.eonet_id}</span></div>
            <div><strong>Location:</strong> ${evt.latitude.toFixed(3)}°N, ${evt.longitude.toFixed(3)}°E</div>
            <div><strong>Observed:</strong> ${evt.first_observed ? new Date(evt.first_observed).toLocaleDateString() : "Active"}</div>
            ${evt.magnitude_value != null ? `<div><strong>Radiative Extent:</strong> ${evt.magnitude_value} ${evt.magnitude_unit || ""}</div>` : ""}
            <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #E2DEC9; font-size: 11px;">
              <a href="${evt.eonet_link || `https://eonet.gsfc.nasa.gov/api/v3/events/${evt.eonet_id}`}" target="_blank" rel="noopener noreferrer" style="color: #059669; font-weight: 700; text-decoration: underline;">
                Inspect Official NASA Record ↗
              </a>
            </div>
          </div>
        `;

        eonetMarker.bindPopup(popupHtml);
        eonetLayerRef.current?.addLayer(eonetMarker);
      });
    }
  }, [hotspotsData, harmonizedCells, nasaEvents, showModis, showViirs, showGrid, showEonet]);

  function handleResetView() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([initialLat, initialLon], initialZoom);
      mapInstanceRef.current.invalidateSize();
    }
  }

  const totalPoints = hotspotsData?.features?.length || 0;
  const totalEonet = nasaEvents?.length || 0;

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[640px] rounded-2xl overflow-hidden border border-[#E2DEC9] bg-[#EFECE1] shadow-sm">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
      />

      {/* Top-Left Status Badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:gap-2 max-w-[calc(100%-10.5rem)] sm:max-w-none rounded-xl border border-[#E2DEC9] bg-[#FCFBF7]/95 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#10243A] shadow-sm backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6B2B]" />
          <span>South Asia</span>
        </span>
        <span className="text-[#E2DEC9]">|</span>
        <span>{totalPoints.toLocaleString()} Hotspots</span>
        <span className="text-[#E2DEC9] hidden sm:inline">|</span>
        <span className="hidden sm:inline">{harmonizedCells.length.toLocaleString()} Cells</span>
        {totalEonet > 0 && (
          <>
            <span className="text-[#E2DEC9] hidden sm:inline">|</span>
            <span className="text-[#059669] font-bold hidden sm:inline">{totalEonet} NASA</span>
          </>
        )}
      </div>

      {/* Top-Right Collapsible Layer Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-40 sm:w-56 rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7]/95 p-2.5 sm:p-4 text-[11px] sm:text-xs text-[#10243A] shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setControlsExpanded((prev) => !prev)}
            className="flex flex-1 items-center gap-1.5 font-bold text-[#10243A] text-left"
          >
            <Layers className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span className="truncate">Satellite Layers</span>
            {controlsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 ml-auto text-[#4A607A]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-auto text-[#4A607A]" />
            )}
          </button>
          <button
            type="button"
            onClick={handleResetView}
            title="Reset map view to South Asia"
            className="rounded-lg border border-[#E2DEC9] bg-[#F7F6EF] p-1 text-[#10243A] hover:bg-[#10243A] hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>

        {controlsExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-[#E2DEC9] space-y-2.5">
            {/* MODIS Toggle (Deep Plum #35063D) */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#35063D] border border-[#1A021F]"></span>
                <span className="font-semibold text-[#10243A]">MODIS (~1 km)</span>
              </div>
              <input
                type="checkbox"
                checked={showModis}
                onChange={(e) => setShowModis(e.target.checked)}
                className="h-4 w-4 rounded accent-[#35063D] cursor-pointer"
              />
            </label>

            {/* VIIRS Toggle (Blaze Orange) */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#FF6B2B] border border-[#9A3412]"></span>
                <span className="font-semibold text-[#10243A]">VIIRS (375 m)</span>
              </div>
              <input
                type="checkbox"
                checked={showViirs}
                onChange={(e) => setShowViirs(e.target.checked)}
                className="h-4 w-4 rounded accent-[#FF6B2B] cursor-pointer"
              />
            </label>

            {/* Harmonized Grid Toggle (Royal Blue / Violet) */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 border-2 border-[#2563EB] bg-[#3B82F6]/30 rounded-sm"></span>
                <span className="font-semibold text-[#10243A]">0.1° HAI Grid</span>
              </div>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="h-4 w-4 rounded accent-[#2563EB] cursor-pointer"
              />
            </label>

            {/* NASA Events Toggle (Emerald Green) */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#064E3B]"></span>
                <span className="font-semibold text-[#10243A]">NASA Events</span>
              </div>
              <input
                type="checkbox"
                checked={showEonet}
                onChange={(e) => setShowEonet(e.target.checked)}
                className="h-4 w-4 rounded accent-[#10B981] cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Bottom-Left Distinct Color Legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 rounded-xl border border-[#E2DEC9] bg-[#FCFBF7]/95 px-2.5 py-2 sm:p-3 text-[10px] sm:text-[11px] text-[#10243A] shadow-sm backdrop-blur-md space-y-1 max-w-[calc(100%-4rem)]">
        <div className="font-bold text-[#10243A] flex items-center space-x-1.5">
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2563EB] shrink-0" />
          <span className="truncate">Distinct Layer Legend &amp; 0.1° HAI Grid</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[#4A607A] font-medium">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#35063D] border border-[#1A021F]"></span>
            <span>MODIS (~1 km)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2B] border border-[#9A3412]"></span>
            <span>VIIRS (375 m)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8] border border-[#0284C7]"></span>
            <span>HAI Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6] border border-[#2563EB]"></span>
            <span>HAI Mod</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6] border border-[#7C3AED]"></span>
            <span>HAI High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-[#064E3B]"></span>
            <span>NASA Events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
