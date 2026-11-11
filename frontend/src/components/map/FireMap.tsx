"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSONFeatureCollection, HarmonizedCell } from "@/lib/types";
import { Layers, Eye, EyeOff, Info, Flame, ShieldAlert } from "lucide-react";

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
  initialLat = 23.6850,
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
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: true,
      minZoom: 4,
      maxZoom: 14,
    });

    // Base CartoDB Positron Tiles (High clarity light tiles)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, NASA FIRMS',
      maxZoom: 19,
    }).addTo(map);

    // Create Layer Groups
    const modisGroup = L.layerGroup().addTo(map);
    const viirsGroup = L.layerGroup().addTo(map);
    const gridGroup = L.layerGroup().addTo(map);

    modisLayerRef.current = modisGroup;
    viirsLayerRef.current = viirsGroup;
    gridLayerRef.current = gridGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialLat, initialLon, initialZoom]);

  // Update Layers when data or toggles change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing layers
    modisLayerRef.current?.clearLayers();
    viirsLayerRef.current?.clearLayers();
    gridLayerRef.current?.clearLayers();

    // 1. Render Harmonized Grid Cells
    if (showGrid && gridLayerRef.current && harmonizedCells.length > 0) {
      harmonizedCells.forEach((cell) => {
        const bounds: L.LatLngBoundsExpression = [
          [cell.cell_lat_min, cell.cell_lon_min],
          [cell.cell_lat_max, cell.cell_lon_max],
        ];

        // Color scale based on HAI score
        let fillColor = "#2D8A64"; // green (low)
        if (cell.hai_score > 0.70) fillColor = "#E85D5D"; // red
        else if (cell.hai_score > 0.45) fillColor = "#FF9F43"; // orange
        else if (cell.hai_score > 0.20) fillColor = "#67B7E1"; // blue

        const polygon = L.rectangle(bounds, {
          color: fillColor,
          weight: 1.2,
          opacity: 0.8,
          fillColor: fillColor,
          fillOpacity: 0.25,
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; min-width: 180px;">
            <div style="font-weight: bold; color: #10243A; margin-bottom: 4px; border-bottom: 1px solid #E2E8F0; padding-bottom: 3px;">
              Harmonized Grid Cell (0.1°)
            </div>
            <div><strong>Cell ID:</strong> ${cell.grid_cell_id}</div>
            <div><strong>HAI Score:</strong> <span style="font-weight: bold; color: ${fillColor}">${cell.hai_score.toFixed(3)}</span> <small>(Experimental)</small></div>
            <div><strong>MODIS Detections:</strong> ${cell.modis_count}</div>
            <div><strong>VIIRS Detections:</strong> ${cell.total_viirs_count}</div>
            <div><strong>Total FRP:</strong> ${(cell.total_frp_modis + cell.total_frp_viirs).toFixed(1)} MW</div>
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

        // Visual distinction between MODIS (~1km) and VIIRS (375m)
        const radius = isModis ? 7 : 5;
        const color = isModis ? "#E85D5D" : "#FF9F43";
        const strokeColor = isModis ? "#8B0000" : "#B35A00";

        const marker = L.circleMarker([lat, lon], {
          radius: radius,
          fillColor: color,
          color: strokeColor,
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.75,
        });

        const popupHtml = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.5; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
              <strong style="color: ${isModis ? '#E85D5D' : '#FF9F43'}; font-size: 13px;">
                ${p.instrument} (${p.satellite_platform})
              </strong>
              <span style="font-size: 10px; background: #F1F5F9; padding: 2px 5px; border-radius: 4px; font-weight: 600;">
                ${p.confidence_category || 'nominal'}
              </span>
            </div>
            <div><strong>Coordinates:</strong> ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div>
            <div><strong>Obs Date:</strong> ${p.acq_date} ${p.acq_time ? p.acq_time : ''}</div>
            <div><strong>Fire Radiative Power:</strong> ${p.frp ? p.frp + ' MW' : 'N/A'}</div>
            <div><strong>Brightness Temp:</strong> ${p.brightness ? p.brightness + ' K' : 'N/A'}</div>
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #CBD5E1; font-size: 11px; color: #475569;">
              ℹ️ <strong>Hotspot:</strong> A thermal anomaly detected by infrared sensors, not a confirmed wildfire.
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on("click", () => setSelectedHotspot(p));

        if (isModis) {
          modisLayerRef.current?.addLayer(marker);
        } else {
          viirsLayerRef.current?.addLayer(marker);
        }
      });
    }
  }, [hotspotsData, harmonizedCells, showModis, showViirs, showGrid]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-300 bg-slate-100 flex flex-col">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-10" />

      {/* Floating Layer Controls */}
      <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-slate-200 text-xs text-[#10243A] space-y-2.5 max-w-[220px]">
        <div className="flex items-center space-x-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1.5">
          <Layers className="w-4 h-4 text-[#2D8A64]" />
          <span>Map Layer Toggles</span>
        </div>

        {/* MODIS Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#E85D5D] border border-red-700"></span>
            <span className="font-medium text-slate-700">MODIS (~1 km)</span>
          </div>
          <input
            type="checkbox"
            checked={showModis}
            onChange={(e) => setShowModis(e.target.checked)}
            className="rounded text-[#E85D5D] focus:ring-0 cursor-pointer"
          />
        </label>

        {/* VIIRS Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF9F43] border border-amber-600"></span>
            <span className="font-medium text-slate-700">VIIRS (375 m)</span>
          </div>
          <input
            type="checkbox"
            checked={showViirs}
            onChange={(e) => setShowViirs(e.target.checked)}
            className="rounded text-[#FF9F43] focus:ring-0 cursor-pointer"
          />
        </label>

        {/* Harmonized Grid Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 border border-[#2D8A64] bg-[#2D8A64]/30 rounded-sm"></span>
            <span className="font-medium text-slate-700">Harmonized 0.1°</span>
          </div>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="rounded text-[#2D8A64] focus:ring-0 cursor-pointer"
          />
        </label>
      </div>

      {/* Floating Map Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 text-[11px] text-[#10243A] space-y-1.5 hidden sm:block">
        <div className="font-semibold text-slate-700 flex items-center space-x-1">
          <Info className="w-3 h-3 text-[#67B7E1]" />
          <span>Fire Intensity (FRP) & HAI Index</span>
        </div>
        <div className="flex items-center space-x-4 pt-1">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D8A64]"></span>
            <span>Low HAI (&lt;0.3)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F43]"></span>
            <span>Moderate (0.3-0.7)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E85D5D]"></span>
            <span>High (&gt;0.7)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

