import Link from "next/link";
import {
  Flame, MapPin, ArrowRight, Activity, Eye,
  Layers, ShieldCheck, Download, Grid2X2
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import EducationCard from "@/components/education/EducationCard";
import FirmsSyncButton from "@/components/ui/FirmsSyncButton";
import { getHotspotSummary, getHarmonizedResults, EXPORT_CSV_URL } from "@/lib/api";

export default async function HomePage() {
  const summary = await getHotspotSummary();
  const harmonizedCells = await getHarmonizedResults();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Minimal Editorial Hero (60% Cream Surface, 30% Navy Structure, 10% Fire Accents) */}
      <section className="fd-enter relative overflow-hidden rounded-3xl border border-[#E2DEC9] bg-[#FCFBF7] p-6 sm:p-10 lg:p-12 shadow-sm">
        <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2DEC9] bg-[#F7F6EF] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#10243A]">
              <span className="h-2 w-2 rounded-full bg-[#FF6B2B]" />
              <span>NASA Space Apps Challenge 2026 · MODIS &amp; VIIRS</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-[#10243A] sm:text-5xl lg:text-6xl">
                Two satellites.
                <span className="block text-[#FF6B2B]">
                  Different fire counts.
                </span>
                <span className="block text-[#10243A]">One unified view.</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[#4A607A] sm:text-lg">
                MODIS (~1 km) and VIIRS (375 m) observe fires at different optical resolutions and overpass times, so their raw hotspot counts are never directly equivalent. FireDNA preserves each instrument&apos;s provenance and harmonizes them onto a shared 0.1° grid across Bangladesh and South Asia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B2B] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#e55a1d]"
              >
                <span>Explore Interactive Fire Map</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10243A] px-5 py-3 text-sm font-semibold text-[#F7F6EF] transition-colors hover:bg-[#1E3A5F]"
              >
                <Eye className="h-4 w-4 text-[#FF9F43]" />
                <span>Compare Sensors</span>
              </Link>
              <a
                href={EXPORT_CSV_URL}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] px-4 py-3 text-sm font-semibold text-[#10243A] transition-colors hover:border-[#10243A]"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E2DEC9] pt-4">
              <p className="flex items-center gap-2 text-xs text-[#4A607A]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#FF6B2B]" />
                <span>Hotspots represent satellite thermal anomalies, not confirmed ground wildfires.</span>
              </p>
              <FirmsSyncButton />
            </div>
          </div>

          {/* 30% Navy Blue Architectural Comparison Panel */}
          <aside
            className="rounded-2xl bg-[#10243A] p-6 text-[#F7F6EF] shadow-lg space-y-5"
            aria-label="Satellite resolution comparison"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#FF9F43]">
                  Optical Physics
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-white">
                  Why raw counts differ
                </h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#FF6B2B]">
                <Grid2X2 className="h-5 w-5" />
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#F7F6EF]/80">
              A 375 m pixel is roughly 7× smaller in area than a 1 km pixel, enabling it to resolve small agricultural burns that do not saturate a coarser detector.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E85D5D]/20 text-[#E85D5D]">
                    <Flame className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white">NASA MODIS</span>
                    <span className="block text-[11px] text-[#F7F6EF]/65">Terra &amp; Aqua (2000–Present)</span>
                  </div>
                </div>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-mono font-bold text-white shrink-0">
                  ~1,000 m
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF6B2B]/20 text-[#FF6B2B]">
                    <Activity className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white">NASA VIIRS</span>
                    <span className="block text-[11px] text-[#F7F6EF]/65">SNPP, NOAA-20 &amp; NOAA-21</span>
                  </div>
                </div>
                <span className="rounded-md bg-[#FF6B2B] px-2.5 py-1 text-xs font-mono font-bold text-white shrink-0">
                  375 m
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#FF6B2B]/15 border border-[#FF6B2B]/30 px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Layers className="h-4 w-4 text-[#FF6B2B]" />
                <span>FireDNA Harmonized Grid</span>
              </div>
              <span className="font-mono font-bold text-[#FF9F43]">0.1° (~11 km)</span>
            </div>
          </aside>
        </div>
      </section>

      {/* Regional Telemetry KPIs */}
      <section className="fd-enter fd-delay-1 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B2B]">
              Telemetry Overview
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#10243A]">
              Regional Fire Activity
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E2DEC9] bg-[#FCFBF7] px-3 py-1.5 font-semibold text-[#10243A]">
              <span className="h-2 w-2 rounded-full bg-[#FF6B2B]" />
              <span>NASA FIRMS Active Feed</span>
            </span>
            {summary.latest_observation && (
              <span className="rounded-full border border-[#E2DEC9] bg-[#FCFBF7] px-3 py-1.5 font-medium text-[#4A607A]">
                Latest Window: {String(summary.latest_observation)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Detections"
            value={summary.total_count.toLocaleString()}
            subtitle="Active thermal anomalies"
            icon={Flame}
            variant="fire"
            badge="All Sensors"
          />
          <StatCard
            title="MODIS (Terra & Aqua)"
            value={summary.modis_count.toLocaleString()}
            subtitle="~1 km spatial footprint"
            icon={Layers}
            variant="navy"
            trend={`${((summary.modis_count / (summary.total_count || 1)) * 100).toFixed(0)}% share`}
          />
          <StatCard
            title="VIIRS (SNPP & NOAA)"
            value={summary.viirs_count.toLocaleString()}
            subtitle="375 m high-res swath"
            icon={Activity}
            variant="fire"
            trend={`${((summary.viirs_count / (summary.total_count || 1)) * 100).toFixed(0)}% share`}
          />
          <StatCard
            title="Harmonized Cells"
            value={harmonizedCells.length}
            subtitle="0.1° (~11 km) unified grid"
            icon={ShieldCheck}
            variant="navy"
            badge="HAI Engine"
          />
        </div>
      </section>

      {/* Core Navigation Pathways */}
      <section className="fd-enter fd-delay-2 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="group flex flex-col justify-between rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10243A]/40 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10243A] text-[#FF6B2B]">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#10243A]">
              Interactive Satellite Fire Map
            </h3>
            <p className="text-sm leading-relaxed text-[#4A607A]">
              Inspect thermal hotspots across Bangladesh, the Chittagong Hill Tracts, and the Sundarbans with layer toggles for MODIS, VIIRS, and 0.1° HAI cells.
            </p>
          </div>
          <Link
            href="/map"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6B2B] hover:text-[#10243A] transition-colors"
          >
            <span>Open Geospatial Map</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="group flex flex-col justify-between rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10243A]/40 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10243A] text-[#FF9F43]">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#10243A]">
              Sensor Comparison Lab
            </h3>
            <p className="text-sm leading-relaxed text-[#4A607A]">
              Analyze why VIIRS detects 4× to 6× more hotspots than MODIS over the same grid cell, and how FireDNA normalizes radiative power.
            </p>
          </div>
          <Link
            href="/compare"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6B2B] hover:text-[#10243A] transition-colors"
          >
            <span>Launch Comparison Lab</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="group flex flex-col justify-between rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10243A]/40 hover:shadow-md">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10243A] text-[#FF6B2B]">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-extrabold text-[#10243A]">
              Calendar &amp; Anomaly Z-Scores
            </h3>
            <p className="text-sm leading-relaxed text-[#4A607A]">
              Explore 365-day seasonal burning patterns and identify statistically unusual activity relative to historical monthly baselines.
            </p>
          </div>
          <Link
            href="/anomalies"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#FF6B2B] hover:text-[#10243A] transition-colors"
          >
            <span>Inspect Anomalies</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Educational Science Section */}
      <section className="fd-enter fd-delay-3 space-y-4 border-t border-[#E2DEC9] pt-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B2B]">
            Scientific Literacy
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[#10243A]">
            Understanding Satellite Fire Data
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EducationCard
            question="What is a satellite hotspot?"
            shortAnswer="A hotspot is a thermal anomaly detected by spaceborne infrared sensors — an area significantly hotter than its surroundings."
            detailedAnswer="Satellites like MODIS and VIIRS carry middle-infrared (~4 µm) and thermal-infrared (~11 µm) detectors. Active fires emit intense thermal radiation. A single hotspot detection may correspond to agricultural residue burning, forest fires, prescribed burns, or industrial gas flares."
            tag="Fundamentals"
            defaultExpanded={true}
          />

          <EducationCard
            question="Why does VIIRS detect more hotspots than MODIS?"
            shortAnswer="VIIRS has 375-meter pixels compared to MODIS's ~1,000-meter pixels, allowing it to spot smaller and cooler fires."
            detailedAnswer="Because VIIRS pixels cover ~7× less ground area than MODIS pixels, a small agricultural burn that fails to trigger MODIS's ~50 MW threshold easily triggers VIIRS (~5 MW). Both instruments are accurate—they simply have different optical resolutions."
            tag="Sensor Physics"
            defaultExpanded={true}
          />
        </div>
      </section>
    </div>
  );
}
