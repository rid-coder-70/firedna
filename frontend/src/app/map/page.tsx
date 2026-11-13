import dynamic from "next/dynamic";
import {
  getHotspotsGeoJSON,
  getHarmonizedResults,
  getNasaEvents,
  EXPORT_GEOJSON_URL,
  EXPORT_CSV_URL
} from "@/lib/api";
import { Flame, Download } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";
import FirmsSyncButton from "@/components/ui/FirmsSyncButton";
import { FadeIn } from "@/components/ui/MotionWrapper";

// Dynamic client import for Leaflet map
const FireMap = dynamic(() => import("@/components/map/FireMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] sm:h-[540px] lg:h-[620px] bg-[#EFECE1] rounded-2xl flex items-center justify-center border border-[#E2DEC9]">
      <div className="flex flex-col items-center space-y-2 text-[#10243A]">
        <Flame className="w-8 h-8 text-[#FF6B2B] animate-bounce" />
        <span className="text-sm font-bold">Initializing NASA Satellite Fire Map...</span>
      </div>
    </div>
  ),
});

export default async function MapPage() {
  const [hotspotsData, harmonizedCells, nasaEvents] = await Promise.all([
    getHotspotsGeoJSON(),
    getHarmonizedResults(),
    getNasaEvents()
  ]);

  return (
    <div className="py-5 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-5 sm:space-y-8">
      {/* Minimal Header Bar */}
      <FadeIn>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FCFBF7] p-4 sm:p-6 rounded-2xl border border-[#E2DEC9] shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#10243A]">
              Interactive Satellite Fire Map
            </h1>
            <span className="bg-[#FFF2EB] text-[#FF6B2B] border border-[#FF6B2B]/30 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live GIS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A607A] mt-1">
            Visualizing thermal anomalies from MODIS (~1 km), VIIRS (375 m), NASA EONET v3 wildfire events, and FireDNA 0.1° Harmonized Grid Cells.
          </p>
        </div>

        {/* Action Controls - Single clean row on laptop, wraps cleanly on mobile */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <FirmsSyncButton />
          <a
            href={EXPORT_GEOJSON_URL}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#F7F6EF] hover:border-[#10243A] text-[#10243A] text-xs font-semibold border border-[#E2DEC9] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </a>
          <a
            href={EXPORT_CSV_URL}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#10243A] hover:bg-[#1E3A5F] text-[#F7F6EF] text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6B2B]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>
      </FadeIn>

      {/* Main Map Container (South Asia Regional Domain) */}
      <FadeIn delay={0.06} className="w-full">
        <FireMap
          hotspotsData={hotspotsData}
          harmonizedCells={harmonizedCells}
          nasaEvents={nasaEvents}
          initialLat={22.0}
          initialLon={78.0}
          initialZoom={5}
        />
      </FadeIn>

      {/* Educational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="What is Fire Radiative Power (FRP)?"
          shortAnswer="FRP measures the rate of radiant heat energy emitted by an active fire, expressed in megawatts (MW)."
          detailedAnswer="FRP is calculated from middle-infrared (~4 µm) satellite radiance. Because FRP is proportional to the rate of biomass combustion, scientists use it to estimate smoke and carbon emissions."
          tag="Physics"
          defaultExpanded={true}
        />

        <EducationCard
          question="What do the square 0.1° grid cells represent?"
          shortAnswer="The polygons display FireDNA's standardized ~11 km cells combining MODIS and VIIRS observations."
          detailedAnswer="Because MODIS and VIIRS have different pixel sizes and overpass times, FireDNA aggregates detections into equal-interval 0.1° cells and computes the experimental Harmonized Activity Index (HAI)."
          tag="Harmonization"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}
