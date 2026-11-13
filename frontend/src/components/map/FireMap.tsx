"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSONFeatureCollection, HarmonizedCell } from "@/lib/types";
import { Layers, Info, Compass, ChevronDown, ChevronUp } from "lucide-react";

interface FireMapProps {
  hotspotsData: GeoJSONFeatureCollection;
  harmonizedCells?: HarmonizedCell[];
  initialLat?: number;
  initialLon?: number;
  initialZoom?: number;
}

export default function FireMap({
  hotspotsData,
  harmonizedCells = [],
  initialLat = 23.685,
  initialLon = 90.3563,
  initialZoom = 7,
}: FireMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const modisLayerRef = useRef<L.LayerGroup | null>(null);
  const viirsLayerRef = useRef<L.LayerGroup | null>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);

  const [showModis, setShowModis] = useState(true);
  const [showViirs, setShowViirs] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [controlsExpanded, setControlsExpanded] = useState(true);

  // Initialize Map with 100% Free OpenStreetMap Tiles (No API Key Required)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: false,
      minZoom: 4,
      maxZoom: 18,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • NASA FIRMS',
      maxZoom: 19,
    }).addTo(map);

    const gridGroup = L.layerGroup().addTo(map);
    const modisGroup = L.layerGroup().addTo(map);
    const viirsGroup = L.layerGroup().addTo(map);

    gridLayerRef.current = gridGroup;
    modisLayerRef.current = modisGroup;
    viirsLayerRef.current = viirsGroup;
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

    // 1. Render Harmonized 0.1° Grid Cells
    if (showGrid && gridLayerRef.current && harmonizedCells.length > 0) {
      harmonizedCells.forEach((cell) => {
        const bounds: L.LatLngBoundsExpression = [
          [cell.cell_lat_min, cell.cell_lon_min],
          [cell.cell_lat_max, cell.cell_lon_max],
        ];

        const score = cell.hai_score ?? 0;
        let strokeColor = "#10243A";
        let fillColor = "#10243A";
        if (score > 0.65) {
          strokeColor = "#E85D5D";
          fillColor = "#FF6B2B";
        } else if (score > 0.35) {
          strokeColor = "#FF9F43";
          fillColor = "#FF9F43";
        }

        const polygon = L.rectangle(bounds, {
          color: strokeColor,
          weight: 1.5,
          opacity: 0.85,
          fillColor: fillColor,
          fillOpacity: 0.22,
        });

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 185px; padding: 4px; color: #10243A;">
            <div style="font-weight: 800; color: #10243A; margin-bottom: 6px; border-bottom: 1px solid #E2DEC9; padding-bottom: 4px;">
              Harmonized Grid Cell (0.1°)
            </div>
            <div><strong>Cell ID:</strong> <span style="font-family: monospace;">${cell.grid_cell_id}</span></div>
            <div><strong>HAI Score:</strong> <span style="font-weight: 800; color: #FF6B2B;">${score.toFixed(3)}</span> <small>(Prototype)</small></div>
            <div><strong>MODIS (~1 km):</strong> ${cell.modis_count} detections</div>
            <div><strong>VIIRS (375 m):</strong> ${cell.total_viirs_count} detections</div>
            <div><strong>Combined FRP:</strong> ${(cell.total_frp_modis + cell.total_frp_viirs).toFixed(1)} MW</div>
          </div>
        `;
        polygon.bindPopup(popupContent);
        gridLayerRef.current?.addLayer(polygon);
      });
    }

    // 2. Render Point Hotspots
    if (hotspotsData && hotspotsData.features) {
      hotspotsData.features.forEach((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        const p = feature.properties;
        const isModis = p.instrument === "MODIS";

        if (isModis && !showModis) return;
        if (!isModis && !showViirs) return;

        const radius = isModis ? 8 : 5.5;
        const fillColor = isModis ? "#E85D5D" : "#FF6B2B";
        const borderColor = "#10243A";

        const marker = L.circleMarker([lat, lon], {
          radius: radius,
          fillColor: fillColor,
          color: borderColor,
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.88,
        });

        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; line-height: 1.5; min-width: 195px; padding: 4px; color: #10243A;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2DEC9; padding-bottom: 4px;">
              <strong style="color: #10243A; font-size: 13px;">
                ${p.instrument} · ${p.satellite_platform}
              </strong>
              <span style="font-size: 10px; background: #10243A; color: #F7F6EF; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">
                ${p.confidence_category || "nominal"}
              </span>
            </div>
            <div><strong>Coordinates:</strong> ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div>
            <div><strong>Observed:</strong> ${p.acq_date} ${p.acq_time ? p.acq_time + " UTC" : ""}</div>
            <div><strong>Radiative Power (FRP):</strong> <strong style="color: #FF6B2B;">${p.frp ? p.frp + " MW" : "N/A"}</strong></div>
            <div><strong>Brightness Temp:</strong> ${p.brightness ? p.brightness + " K" : "N/A"}</div>
            <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #E2DEC9; font-size: 11px; color: #4A607A;">
              Thermal anomaly detected by NASA FIRMS infrared sensors.
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
  }, [hotspotsData, harmonizedCells, showModis, showViirs, showGrid]);

  function handleResetView() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([initialLat, initialLon], initialZoom);
      mapInstanceRef.current.invalidateSize();
    }
  }

  const totalPoints = hotspotsData?.features?.length || 0;

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[620px] rounded-2xl overflow-hidden border border-[#E2DEC9] bg-[#EFECE1] shadow-sm">
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
      />

      {/* Top-Left Status Badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#E2DEC9] bg-[#FCFBF7]/95 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-[#10243A] shadow-sm backdrop-blur-md">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6B2B]" />
        <span>{totalPoints} Hotspots</span>
        <span className="text-[#E2DEC9]">|</span>
        <span>{harmonizedCells.length} Cells</span>
      </div>

      {/* Top-Right Collapsible Layer Controls (Responsive for Mobile & Laptop) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-48 sm:w-56 rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7]/95 p-3 sm:p-4 text-xs text-[#10243A] shadow-md backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setControlsExpanded((prev) => !prev)}
            className="flex flex-1 items-center gap-1.5 font-bold text-[#10243A] text-left"
          >
            <Layers className="w-4 h-4 shrink-0 text-[#FF6B2B]" />
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
            title="Reset map view to Bangladesh"
            className="rounded-lg border border-[#E2DEC9] bg-[#F7F6EF] p-1 text-[#10243A] hover:bg-[#10243A] hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>

        {controlsExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-[#E2DEC9] space-y-2.5">
            {/* MODIS Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#E85D5D] border border-[#10243A]"></span>
                <span className="font-semibold text-[#10243A]">MODIS (~1 km)</span>
              </div>
              <input
                type="checkbox"
                checked={showModis}
                onChange={(e) => setShowModis(e.target.checked)}
                className="h-4 w-4 rounded accent-[#10243A] cursor-pointer"
              />
            </label>

            {/* VIIRS Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#FF6B2B] border border-[#10243A]"></span>
                <span className="font-semibold text-[#10243A]">VIIRS (375 m)</span>
              </div>
              <input
                type="checkbox"
                checked={showViirs}
                onChange={(e) => setShowViirs(e.target.checked)}
                className="h-4 w-4 rounded accent-[#10243A] cursor-pointer"
              />
            </label>

            {/* Harmonized Grid Toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 border border-[#10243A] bg-[#FF6B2B]/25 rounded-sm"></span>
                <span className="font-semibold text-[#10243A]">0.1° HAI Grid</span>
              </div>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="h-4 w-4 rounded accent-[#10243A] cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Bottom-Left Minimal Legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 rounded-xl border border-[#E2DEC9] bg-[#FCFBF7]/95 px-2.5 py-2 sm:p-3 text-[10px] sm:text-[11px] text-[#10243A] shadow-sm backdrop-blur-md space-y-1 max-w-[calc(100%-4rem)]">
        <div className="font-bold text-[#10243A] flex items-center space-x-1.5">
          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#FF6B2B] shrink-0" />
          <span className="truncate">Harmonized Activity Index (HAI)</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[#4A607A] font-medium">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#10243A]"></span>
            <span>Low (&lt;0.35)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF9F43]"></span>
            <span>Moderate (0.35–0.65)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF6B2B]"></span>
            <span>High (&gt;0.65)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
