import Link from "next/link";
import {
  Flame, MapPin, ArrowRight, Activity, Eye,
  Sparkles, Layers, ShieldCheck, Download
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import EducationCard from "@/components/education/EducationCard";
import { getHotspotSummary, getDailyAnalytics, getHarmonizedResults, EXPORT_CSV_URL } from "@/lib/api";

export default async function HomePage() {
  const summary = await getHotspotSummary();
  const dailySeries = await getDailyAnalytics();
  const harmonizedCells = await getHarmonizedResults();

  return (
    <div className="space-y-10 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10243A] via-[#163352] to-[#0B1928] text-white p-8 sm:p-12 shadow-2xl border border-slate-700/60">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-[#2D8A64]/30 border border-[#2D8A64]/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NASA Space Apps Challenge 2026 • MODIS & VIIRS Hot Spots</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Understand Our Planet&apos;s Fires. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9F43] to-[#E85D5D]">
              Decoded Through Satellite DNA.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Explore active fire observations from NASA Terra, Aqua, Suomi-NPP, and NOAA satellites. 
            FireDNA harmonizes different satellite resolutions into a unified scientific framework for Bangladesh and South Asia.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/map"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF9F43] to-[#E85D5D] text-[#10243A] font-bold text-sm shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] transition-all"
            >
              <span>Explore Interactive Fire Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/compare"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              <Eye className="w-4 h-4 text-[#67B7E1]" />
              <span>Sensor Comparison Lab</span>
            </Link>

            <a
              href={EXPORT_CSV_URL}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-700 transition-all ml-auto"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-br from-[#FF9F43]/20 to-[#E85D5D]/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Key Live Statistics */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#10243A]">Regional Fire Activity Overview</h2>
            <p className="text-xs text-slate-500">Real-time indicators across Bangladesh & South Asian bounding box</p>
          </div>
          <span className="text-xs bg-emerald-50 text-[#2D8A64] border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            Freshness: Past 10 Days
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Hotspots"
            value={summary.total_count.toLocaleString()}
            subtitle="Satellite thermal detections"
            icon={Flame}
            color="orange"
            badge="All Sensors"
          />
          <StatCard
            title="MODIS (Terra & Aqua)"
            value={summary.modis_count.toLocaleString()}
            subtitle="~1 km spatial resolution"
            icon={Layers}
            color="red"
            trend={`${((summary.modis_count / (summary.total_count || 1)) * 100).toFixed(0)}% of total`}
          />
          <StatCard
            title="VIIRS (SNPP & NOAA)"
            value={summary.viirs_count.toLocaleString()}
            subtitle="375 m fine resolution"
            icon={Activity}
            color="orange"
            trend={`${((summary.viirs_count / (summary.total_count || 1)) * 100).toFixed(0)}% of total`}
          />
          <StatCard
            title="Harmonized Cells"
            value={harmonizedCells.length}
            subtitle="0.1° (~11 km) unified grid"
            icon={ShieldCheck}
            color="green"
            badge="HAI Engine"
          />
        </div>
      </section>

      {/* Interactive Pathways */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Map Entry */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9F43] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Interactive Satellite Fire Map</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Visualize thermal hotspots detected across Bangladesh, Chittagong Hill Tracts, and the Sundarbans with custom layer toggles for MODIS and VIIRS.
            </p>
          </div>
          <Link
            href="/map"
            className="mt-5 inline-flex items-center space-x-1.5 text-sm font-semibold text-[#FF9F43] hover:text-orange-600"
          >
            <span>Launch Full Screen Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 2: Sensor Lab */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#67B7E1] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Sensor Comparison Lab</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Why does VIIRS report 5x more fire points than MODIS for the exact same fire? Step inside our laboratory to examine side-by-side satellite optics.
            </p>
          </div>
          <Link
            href="/compare"
            className="mt-5 inline-flex items-center space-x-1.5 text-sm font-semibold text-[#67B7E1] hover:text-sky-700"
          >
            <span>Enter Comparison Lab</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card 3: Calendar & Anomalies */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D8A64] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Fire Calendar & Anomalies</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track 365 days of seasonal crop residue burning and examine unusual fire events using statistical Z-scores and climatological baselines.
            </p>
          </div>
          <Link
            href="/calendar"
            className="mt-5 inline-flex items-center space-x-1.5 text-sm font-semibold text-[#2D8A64] hover:text-emerald-700"
          >
            <span>View Fire Calendar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Educational Hub Highlights */}
      <section className="space-y-4 pt-4">
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold text-[#10243A]">Learn Satellite Fire Science</h2>
          <p className="text-xs text-slate-500">Key scientific concepts explained in simple language for students and researchers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EducationCard
            question="What is a satellite hotspot?"
            shortAnswer="A hotspot is a thermal anomaly detected by infrared satellite sensors — a point on Earth that is significantly hotter than its surroundings."
            detailedAnswer="Satellites like MODIS and VIIRS carry middle-infrared (4 µm) and thermal-infrared (11 µm) detectors. When a fire burns, it emits intense infrared energy. The satellite detects this temperature difference. A hotspot could be an agricultural stubble fire, a forest fire, a prescribed burn, or an industrial flare."
            tag="Fundamentals"
            defaultExpanded={true}
          />

          <EducationCard
            question="Why does VIIRS detect more fires than MODIS?"
            shortAnswer="VIIRS has 375-meter pixels, whereas MODIS has ~1,000-meter (1 km) pixels. Smaller pixels can spot much smaller, cooler fires."
            detailedAnswer="Because VIIRS pixels are about 7 times smaller in area than MODIS pixels, a small agricultural fire that only covers a fraction of a 1 km MODIS pixel might not trigger MODIS's detection threshold (~50 MW). But that same fire easily triggers VIIRS (~5 MW). Neither sensor is 'wrong' — they have different optical lenses!"
            tag="Sensors"
            defaultExpanded={true}
          />
        </div>
      </section>
    </div>
  );
}

