import { getSensorComparison } from "@/lib/api";
import { SplitSquareVertical, Info } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";
import ComparisonChart from "@/components/charts/ComparisonChart";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/MotionWrapper";

export default async function ComparePage() {
  const comparison = await getSensorComparison();

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center shadow-sm">
            <SplitSquareVertical className="w-5 h-5 shrink-0" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-[#10243A]">
              Sensor Comparison Laboratory
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4A607A]">
              Examining optical discrepancies between NASA MODIS (~1 km) and VIIRS (375 m) satellite instruments.
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#F7F6EF] rounded-xl border border-[#E2DEC9] text-xs text-[#10243A] leading-relaxed flex items-start gap-2.5 sm:gap-3">
          <Info className="w-4 h-4 text-[#FF6B2B] shrink-0 mt-0.5" />
          <p className="min-w-0 flex-1">
            <strong>Core Scientific Premise:</strong> Satellites with different optical resolutions see the same fire events differently.
            VIIRS (375 m) routinely detects 3× to 6× more hotspots than MODIS (1 km) because smaller pixels resolve small agricultural burns.
            FireDNA harmonizes them onto a shared 0.1° grid cell framework.
          </p>
        </div>
      </div>
      </FadeIn>

      {/* 3-Column Synchronized Laboratory */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Column 1: MODIS */}
        <StaggerItem hoverLift className="rounded-2xl bg-[#FCFBF7] border border-[#E2DEC9] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DEC9] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#E85D5D]"></span>
              <h2 className="font-extrabold text-lg text-[#10243A]">NASA MODIS</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#10243A]/10 text-[#10243A] px-2 py-0.5 rounded-md">
              Legacy Heritage
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-[#4A607A]">
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Satellites</span>
              <strong className="text-[#10243A]">{comparison.modis.platform}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Spatial Resolution</span>
              <strong className="text-[#10243A]">{comparison.modis.spatial_resolution}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Detection Threshold</span>
              <strong className="text-[#10243A]">{comparison.modis.detection_threshold}</strong>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span>Total Detections</span>
              <strong className="text-2xl text-[#10243A] font-extrabold">
                {comparison.modis.total_period_detections}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-[#F7F6EF] border border-[#E2DEC9] rounded-xl text-[11px] text-[#4A607A] leading-relaxed">
            Fewer detections due to coarser 1 km footprint, but provides over 20+ years of uninterrupted historical baseline records since 2000.
          </div>
        </StaggerItem>

        {/* Column 2: VIIRS */}
        <StaggerItem hoverLift className="rounded-2xl bg-[#FCFBF7] border border-[#E2DEC9] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DEC9] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#FF6B2B]"></span>
              <h2 className="font-extrabold text-lg text-[#10243A]">NASA VIIRS</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF2EB] text-[#FF6B2B] px-2 py-0.5 rounded-md">
              375 m High-Res
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-[#4A607A]">
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Satellites</span>
              <strong className="text-[#10243A]">{comparison.viirs.platforms.join(", ")}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Spatial Resolution</span>
              <strong className="text-[#10243A]">{comparison.viirs.spatial_resolution}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E2DEC9]/60">
              <span>Detection Threshold</span>
              <strong className="text-[#10243A]">{comparison.viirs.detection_threshold}</strong>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span>Total Detections</span>
              <strong className="text-2xl text-[#FF6B2B] font-extrabold">
                {comparison.viirs.total_period_detections}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-[#F7F6EF] border border-[#E2DEC9] rounded-xl text-[11px] text-[#4A607A] leading-relaxed">
            Detects ~5× more hotspots in this cell. 375 m channels capture smaller perimeter fires and cool nighttime residual heat.
          </div>
        </StaggerItem>

        {/* Column 3: FireDNA Harmonized (30% Navy Structural Card) */}
        <StaggerItem hoverLift className="rounded-2xl bg-[#10243A] text-[#F7F6EF] p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#FF9F43]"></span>
              <h2 className="font-extrabold text-lg text-white">FireDNA Harmonized</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FF6B2B] text-white px-2 py-0.5 rounded-md">
              Unified Grid
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-[#F7F6EF]/75">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span>Grid Cell ID</span>
              <strong className="text-white font-mono text-[11px]">{comparison.grid_cell_id}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span>Grid Resolution</span>
              <strong className="text-white">{comparison.harmonized.grid_resolution_deg}° (~11 km)</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span>Temporal Window</span>
              <strong className="text-white">{comparison.harmonized.temporal_window_hours}h UTC Day</strong>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span>Latest HAI Score</span>
              <strong className="text-2xl text-[#FF9F43] font-extrabold">
                {comparison.harmonized.hai_scores[comparison.harmonized.hai_scores.length - 1].toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-[#F7F6EF]/80 leading-relaxed">
            Composite index balancing count (40%), log-scaled maximum FRP (45%), and confidence (15%) for fair cross-sensor comparison.
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Synchronized Recharts Visualization */}
      <FadeIn delay={0.08}>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-extrabold text-[#10243A]">
              Side-by-Side Observation Timeline
            </h3>
            <p className="text-xs text-[#4A607A]">
              Comparing MODIS and VIIRS raw counts with the FireDNA Harmonized Activity Index (HAI)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-[#10243A]">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-[#E85D5D] rounded-sm"></span>
              <span>MODIS</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-[#FF6B2B] rounded-sm"></span>
              <span>VIIRS</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-[#10243A] rounded-sm"></span>
              <span>Harmonized HAI</span>
            </span>
          </div>
        </div>

        <ComparisonChart
          dates={comparison.dates}
          modisCounts={comparison.modis.daily_counts}
          viirsCounts={comparison.viirs.daily_counts}
          haiScores={comparison.harmonized.hai_scores}
        />
      </div>
      </FadeIn>

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
