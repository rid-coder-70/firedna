import { getSensorComparison } from "@/lib/api";
import { SplitSquareVertical, Layers, Activity, ShieldCheck, Sparkles, Info } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";
import ComparisonChart from "@/components/charts/ComparisonChart";

export default async function ComparePage() {
  const comparison = await getSensorComparison();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9F43] flex items-center justify-center">
            <SplitSquareVertical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">
              Sensor Comparison Laboratory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Examining optical discrepancies between NASA MODIS and VIIRS satellite instruments.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start space-x-3">
          <Info className="w-4 h-4 text-[#67B7E1] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Core Scientific Premise:</strong> Satellites with different optical resolutions see the same fire events differently. 
            VIIRS (375 m) routinely detects 3x to 6x more hotspots than MODIS (1 km) because smaller pixels resolve small agricultural burns. 
            FireDNA harmonizes them onto a shared 0.1° grid cell framework.
          </p>
        </div>
      </div>

      {/* 3-Column Synchronized Laboratory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: MODIS */}
        <div className="rounded-3xl bg-white border-2 border-[#E85D5D]/40 p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E85D5D]"></span>
              <h2 className="font-bold text-lg text-[#10243A]">NASA MODIS</h2>
            </div>
            <span className="text-[10px] font-semibold bg-red-50 text-[#E85D5D] px-2 py-0.5 rounded-full">
              Legacy Heritage
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Satellites</span>
              <strong className="text-slate-800">{comparison.modis.platform}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Spatial Resolution</span>
              <strong className="text-slate-800">{comparison.modis.spatial_resolution}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Detection Threshold</span>
              <strong className="text-slate-800">{comparison.modis.detection_threshold}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Total Detections</span>
              <strong className="text-2xl text-[#E85D5D] font-extrabold">{comparison.modis.total_period_detections}</strong>
            </div>
          </div>

          <div className="p-3 bg-red-50/50 rounded-xl text-[11px] text-red-950 leading-relaxed">
            Fewer detections due to coarser 1 km footprint, but provides over 20+ years of uninterrupted historical baseline records since 2000.
          </div>
        </div>

        {/* Column 2: VIIRS */}
        <div className="rounded-3xl bg-white border-2 border-[#FF9F43]/40 p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#FF9F43]"></span>
              <h2 className="font-bold text-lg text-[#10243A]">NASA VIIRS</h2>
            </div>
            <span className="text-[10px] font-semibold bg-orange-50 text-[#FF9F43] px-2 py-0.5 rounded-full">
              High Resolution
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Satellites</span>
              <strong className="text-slate-800">{comparison.viirs.platforms.join(", ")}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Spatial Resolution</span>
              <strong className="text-slate-800">{comparison.viirs.spatial_resolution}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Detection Threshold</span>
              <strong className="text-slate-800">{comparison.viirs.detection_threshold}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Total Detections</span>
              <strong className="text-2xl text-[#FF9F43] font-extrabold">{comparison.viirs.total_period_detections}</strong>
            </div>
          </div>

          <div className="p-3 bg-orange-50/50 rounded-xl text-[11px] text-orange-950 leading-relaxed">
            Detects ~5x more hotspots in this cell. 375 m channels capture smaller perimeter fires and cool night-time residual heat.
          </div>
        </div>

        {/* Column 3: FireDNA Harmonized */}
        <div className="rounded-3xl bg-white border-2 border-[#2D8A64]/40 p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#2D8A64]"></span>
              <h2 className="font-bold text-lg text-[#10243A]">FireDNA Harmonized</h2>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-50 text-[#2D8A64] px-2 py-0.5 rounded-full">
              Unified Standard
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Grid Cell ID</span>
              <strong className="text-slate-800 font-mono text-[11px]">{comparison.grid_cell_id}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Grid Resolution</span>
              <strong className="text-slate-800">{comparison.harmonized.grid_resolution_deg}° (~11 km)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Temporal Window</span>
              <strong className="text-slate-800">{comparison.harmonized.temporal_window_hours}h UTC Day</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Latest HAI Score</span>
              <strong className="text-2xl text-[#2D8A64] font-extrabold">
                {comparison.harmonized.hai_scores[comparison.harmonized.hai_scores.length - 1].toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-xl text-[11px] text-emerald-950 leading-relaxed">
            Composite index balancing count (40%), log-scaled maximum FRP (45%), and confidence (15%) for fair cross-sensor comparison.
          </div>
        </div>
      </div>

      {/* Synchronized Recharts Visualization */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-[#10243A]">Side-by-Side Observation Timeline</h3>
            <p className="text-xs text-slate-500">Comparing MODIS and VIIRS raw counts with the FireDNA Harmonized Activity Index (HAI)</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-[#E85D5D] rounded-sm"></span><span>MODIS</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-[#FF9F43] rounded-sm"></span><span>VIIRS</span></span>
            <span className="flex items-center space-x-1"><span className="w-3 h-3 bg-[#2D8A64] rounded-sm"></span><span>Harmonized HAI</span></span>
          </div>
        </div>

        <ComparisonChart
          dates={comparison.dates}
          modisCounts={comparison.modis.daily_counts}
          viirsCounts={comparison.viirs.daily_counts}
          haiScores={comparison.harmonized.hai_scores}
        />
      </div>

      {/* Educational Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="What is data harmonization?"
          shortAnswer="Data harmonization brings observations from different sensors into a shared spatial grid and common measurement scale."
          detailedAnswer="Instead of pretending that 1 MODIS detection equals 1 VIIRS detection, FireDNA projects both onto 0.1° grid cells (~11 km). Inside each cell, we normalize detection density and fire radiative power independently before computing a combined index."
          tag="Methodology"
          defaultExpanded={true}
        />

        <EducationCard
          question="Is the Harmonized Activity Index (HAI) official?"
          shortAnswer="No. HAI is an experimental prototype metric created by FireDNA for demonstration and research."
          detailedAnswer="We are scientifically transparent: HAI is not an official NASA product and has not been ground-truth calibrated. It provides an intuitive, normalized score for comparing fire activity across satellites without misleading raw-count comparisons."
          tag="Scientific Honesty"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}

