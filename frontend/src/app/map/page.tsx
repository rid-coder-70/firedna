import dynamic from "next/dynamic";
import { getHotspotsGeoJSON, getHarmonizedResults, EXPORT_GEOJSON_URL, EXPORT_CSV_URL } from "@/lib/api";
import { Flame, Layers, Download, Info, Sparkles, Filter } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";

// Dynamic client import for Leaflet map
const FireMap = dynamic(() => import("@/components/map/FireMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
      <div className="flex flex-col items-center space-y-2 text-slate-500">
        <Flame className="w-8 h-8 text-[#FF9F43] animate-bounce" />
        <span className="text-sm font-semibold">Loading NASA Satellite Fire Map...</span>
      </div>
    </div>
  ),
});

export default async function MapPage() {
  const hotspotsData = await getHotspotsGeoJSON();
  const harmonizedCells = await getHarmonizedResults();

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-[#10243A]">Interactive Satellite Fire Map</h1>
            <span className="bg-orange-50 text-[#FF9F43] border border-orange-200 text-xs font-bold px-2 py-0.5 rounded-full">
              Live GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Visualizing active thermal anomalies from MODIS (~1 km) and VIIRS (375 m) alongside FireDNA 0.1° Harmonized Grid Cells.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <a
            href={EXPORT_GEOJSON_URL}
            download
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#10243A] text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download GeoJSON</span>
          </a>
          <a
            href={EXPORT_CSV_URL}
            download
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#2D8A64] hover:bg-[#236e4f] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Main Map Component */}
      <div className="w-full h-[620px]">
        <FireMap
          hotspotsData={hotspotsData}
          harmonizedCells={harmonizedCells}
          initialLat={23.6850}
          initialLon={90.3563}
          initialZoom={7}
        />
      </div>

      {/* Educational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="What is Fire Radiative Power (FRP)?"
          shortAnswer="FRP measures the rate of radiant heat energy emitted by a fire, expressed in megawatts (MW)."
          detailedAnswer="FRP is calculated directly from satellite middle-infrared radiance. Because FRP is directly proportional to the amount of biomass burning, it allows scientists to estimate how much smoke, carbon dioxide, and particulate matter (PM2.5) the fire is releasing into our atmosphere."
          tag="Physics"
        />

        <EducationCard
          question="What do the square grid cells represent?"
          shortAnswer="The polygons show FireDNA's 0.1° (~11 km) harmonized cells combining MODIS and VIIRS detections."
          detailedAnswer="Because MODIS and VIIRS sensors have different pixel shapes and overpass times, FireDNA groups all observations into standardized 0.1° equal-interval cells. Inside each cell, we calculate the experimental Harmonized Activity Index (HAI) based on count, maximum FRP, and observation confidence."
          tag="Harmonization"
        />
      </div>
    </div>
  );
}

