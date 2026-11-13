import {
  Globe, Shield, Award, Flame, Layers, Activity,
  CheckCircle2, ArrowRight, Cpu, Database
} from "lucide-react";
import Link from "next/link";
import EducationCard from "@/components/education/EducationCard";

export default function AboutPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Minimal Editorial Hero (60% Cream Surface, 30% Navy Structure, 10% Fire Accents) */}
      <section className="rounded-3xl border border-[#E2DEC9] bg-[#FCFBF7] p-6 sm:p-10 lg:p-12 shadow-sm">
        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-12">
          <div className="space-y-5">
            <div className="inline-flex items-center space-x-2 rounded-full border border-[#E2DEC9] bg-[#F7F6EF] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#10243A]">
              <Award className="w-3.5 h-3.5 text-[#FF6B2B]" />
              <span>NASA Space Apps Challenge 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#10243A] leading-[1.1]">
              About Fire<span className="text-[#FF6B2B]">DNA</span>
            </h1>

            <p className="text-base sm:text-lg font-bold text-[#10243A]">
              Understand Fire. Connect Data. Protect Our Planet.
            </p>

            <p className="text-sm sm:text-base text-[#4A607A] leading-relaxed max-w-2xl">
              FireDNA was created to solve a fundamental challenge in satellite environmental observation:
              how to fairly harmonize, compare, and understand active-fire telemetry across multiple NASA and NOAA satellites with different optical resolutions and overpass schedules.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <Link
                href="/map"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#FF6B2B] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e55a1d]"
              >
                <span>Open Interactive Fire Map</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <Link
                href="/compare"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#10243A] px-5 py-3 text-xs sm:text-sm font-semibold text-[#F7F6EF] transition-colors hover:bg-[#1E3A5F]"
              >
                <span>Explore Sensor Lab</span>
              </Link>
            </div>
          </div>

          {/* 30% Navy Architectural Mission Specs Card */}
          <aside className="rounded-2xl bg-[#10243A] p-6 text-[#F7F6EF] shadow-md space-y-5">
            <div className="border-b border-white/10 pb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF9F43]">
                Mission Specification
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-white">
                Harmonization Architecture
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <span className="text-[11px] text-[#F7F6EF]/65 block">Spatial Grid</span>
                <strong className="text-lg font-extrabold text-white font-mono">0.1° (~11 km)</strong>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <span className="text-[11px] text-[#F7F6EF]/65 block">Time Window</span>
                <strong className="text-lg font-extrabold text-[#FF9F43] font-mono">24h UTC</strong>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <span className="text-[11px] text-[#F7F6EF]/65 block">Primary Region</span>
                <strong className="text-sm font-bold text-white">Bangladesh</strong>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3.5">
                <span className="text-[11px] text-[#F7F6EF]/65 block">Sensors Unified</span>
                <strong className="text-sm font-bold text-[#FF6B2B]">MODIS + VIIRS</strong>
              </div>
            </div>

            <div className="rounded-xl bg-[#FF6B2B]/15 border border-[#FF6B2B]/30 p-3.5 text-xs text-[#F7F6EF]/90 leading-relaxed">
              <strong className="text-white">HAI Formula:</strong> 40% Normalized Density + 45% Log-Scaled Max FRP + 15% Sensor Confidence.
            </div>
          </aside>
        </div>
      </section>

      {/* The Core Challenge & Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#10243A]" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#EFECE1] text-[#10243A] px-2.5 py-1 rounded-md">
              01 · Optical Discrepancy
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#10243A]">The Problem</h2>
          <p className="text-sm text-[#4A607A] leading-relaxed">
            For over two decades, NASA&apos;s MODIS instrument provided consistent 1 km global fire observations. Starting in 2012, VIIRS introduced high-resolution 375 m detectors.
            Because a 375 m pixel covers roughly 7× less area than a 1 km pixel, VIIRS detects up to 6 times more hotspots for the exact same fire event.
            Without harmonization, researchers and citizens can mistake sharper satellite optics for an artificial surge in burning.
          </p>
        </div>

        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#FF6B2B]" />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#FFF2EB] text-[#FF6B2B] border border-[#FF6B2B]/25 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FFF2EB] text-[#FF6B2B] px-2.5 py-1 rounded-md">
              02 · Spatial Standardization
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#10243A]">The FireDNA Solution</h2>
          <p className="text-sm text-[#4A607A] leading-relaxed">
            FireDNA preserves every original satellite record while projecting detections onto a shared <strong className="text-[#10243A]">0.1° (~11 km) equal-interval grid</strong>.
            Within each cell and 24-hour UTC window, we normalize detection density and Fire Radiative Power (FRP) independently, producing
            an interpretable <strong className="text-[#10243A]">Harmonized Activity Index (HAI)</strong> alongside historical Z-score anomaly metrics.
          </p>
        </div>
      </section>

      {/* End-to-End Scientific Pipeline */}
      <section className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B2B]">
            System Workflow
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#10243A]">
            Four-Stage Scientific Processing Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <div className="flex items-center justify-between">
              <Database className="w-4 h-4 text-[#FF6B2B]" />
              <span className="font-mono text-xs font-bold text-[#10243A]">STEP 01</span>
            </div>
            <h3 className="text-sm font-bold text-[#10243A]">NASA FIRMS Ingestion</h3>
            <p className="text-xs text-[#4A607A] leading-relaxed">
              Fetches MODIS_NRT, VIIRS_SNPP_NRT, and VIIRS_NOAA20/21 active-fire telemetry with automatic schema validation.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <div className="flex items-center justify-between">
              <Layers className="w-4 h-4 text-[#10243A]" />
              <span className="font-mono text-xs font-bold text-[#10243A]">STEP 02</span>
            </div>
            <h3 className="text-sm font-bold text-[#10243A]">0.1° Spatial Gridding</h3>
            <p className="text-xs text-[#4A607A] leading-relaxed">
              Assigns point detections into standardized 0.1° latitude-longitude cells without discarding raw coordinates.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <div className="flex items-center justify-between">
              <Cpu className="w-4 h-4 text-[#FF6B2B]" />
              <span className="font-mono text-xs font-bold text-[#10243A]">STEP 03</span>
            </div>
            <h3 className="text-sm font-bold text-[#10243A]">HAI Normalization</h3>
            <p className="text-xs text-[#4A607A] leading-relaxed">
              Computes composite Harmonized Activity Index scores from sensor-specific count percentiles and log-scaled FRP.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <div className="flex items-center justify-between">
              <Activity className="w-4 h-4 text-[#10243A]" />
              <span className="font-mono text-xs font-bold text-[#10243A]">STEP 04</span>
            </div>
            <h3 className="text-sm font-bold text-[#10243A]">Anomaly Z-Scoring</h3>
            <p className="text-xs text-[#4A607A] leading-relaxed">
              Evaluates daily cell counts against historical monthly baselines (μ ± σ) to surface unusual burning events.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#10243A]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#4A607A]">
            Key questions about satellite fire monitoring and FireDNA methodology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EducationCard
            question="Why is Bangladesh and South Asia the demonstration focus?"
            shortAnswer="South Asia experiences distinct seasonal biomass burning across diverse agro-ecological zones."
            detailedAnswer="From shifting cultivation in the Chittagong Hill Tracts to post-harvest crop residue burning across the Indo-Gangetic plains, Bangladesh and South Asia provide an ideal real-world proving ground for multi-sensor harmonization."
            tag="Geography"
            defaultExpanded={true}
          />

          <EducationCard
            question="Can FireDNA monitor other regions globally?"
            shortAnswer="Yes. The spatial gridding and harmonization engine accepts any global bounding box."
            detailedAnswer="While Bangladesh is pre-configured for the NASA Space Apps demonstration, the underlying database and API accept any latitude/longitude bounding box worldwide."
            tag="Scalability"
            defaultExpanded={true}
          />
        </div>
      </section>

      {/* Technical Stack Summary */}
      <section className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#10243A]">
          Technology Stack
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "Next.js 14 (App Router)",
            "TypeScript",
            "Tailwind CSS",
            "Leaflet & OpenStreetMap",
            "Recharts",
            "FastAPI (Python)",
            "SQLAlchemy 2.0",
            "NASA FIRMS API",
          ].map((tech) => (
            <span
              key={tech}
              className="bg-[#F7F6EF] border border-[#E2DEC9] text-[#10243A] font-semibold px-3.5 py-1.5 rounded-xl"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
