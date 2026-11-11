import Link from "next/link";
import {
  Flame, MapPin, ArrowRight, Activity, Eye, Sparkles,
  Layers, ShieldCheck, Download, Grid2X2
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import EducationCard from "@/components/education/EducationCard";
import { getHotspotSummary, getHarmonizedResults, EXPORT_CSV_URL } from "@/lib/api";

export default async function HomePage() {
  const summary = await getHotspotSummary();
  const harmonizedCells = await getHarmonizedResults();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-700/70 bg-gradient-to-br from-[#10243A] via-[#163352] to-[#0B1928] p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#67B7E1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#E85D5D]/10 blur-3xl" />

        <div className="relative grid items-center gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(290px,0.65fr)] xl:gap-12">
          <div className="space-y-6">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3.5 py-2 text-xs font-semibold leading-5 text-emerald-200 sm:text-sm">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>NASA Space Apps Challenge 2026 <span className="px-1 text-emerald-300/60">·</span> MODIS &amp; VIIRS</span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Understand our planet&apos;s fires.
                <span className="mt-1 block bg-gradient-to-r from-[#FFB04F] via-[#FF8058] to-[#E85D5D] bg-clip-text text-transparent">
                  See the bigger picture.
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                MODIS and VIIRS see fire at different resolutions and times. FireDNA brings their observations together so you can explore the differences across Bangladesh and South Asia.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
              <Link
                href="/map"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF9F43] to-[#E85D5D] px-5 py-3 text-sm font-bold text-[#10243A] shadow-lg shadow-orange-950/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB04F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10243A] motion-reduce:transition-none"
              >
                <span>Explore the fire map</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
              </Link>
              <Link
                href="/compare"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-sky-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67B7E1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10243A] motion-reduce:transition-none"
              >
                <Eye className="h-4 w-4 text-[#67B7E1] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none" />
                <span>Compare the sensors</span>
              </Link>
              <a
                href={EXPORT_CSV_URL}
                download
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67B7E1] motion-reduce:transition-none"
              >
                <Download className="h-4 w-4" />
                <span>Download data</span>
              </a>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-slate-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>Satellite hotspots are thermal observations, not confirmed fire events. HAI is experimental.</span>
            </p>
          </div>

          <aside className="relative rounded-3xl border border-white/10 bg-slate-950/20 p-5 shadow-xl backdrop-blur-sm sm:p-6" aria-label="Satellite resolution comparison">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">A shared view</p>
                <h2 className="mt-2 text-xl font-bold text-white">Different sensors.<br />One comparison grid.</h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-[#67B7E1]">
                <Grid2X2 className="h-5 w-5" />
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Pixel size changes what each satellite can detect. FireDNA keeps those observations distinct while showing them in a common spatial framework.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E85D5D]/15 text-[#FF8A78]">
                    <Flame className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">MODIS</span>
                    <span className="block text-xs text-slate-400">Terra &amp; Aqua</span>
                  </span>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-slate-200">~1 km</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF9F43]/15 text-[#FFB45F]">
                    <Activity className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">VIIRS</span>
                    <span className="block text-xs text-slate-400">Suomi-NPP &amp; NOAA</span>
                  </span>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-slate-200">375 m</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.08] p-3.5">
              <Layers className="h-5 w-5 shrink-0 text-emerald-300" />
              <span className="text-sm text-emerald-100">
                Shared comparison grid <strong className="font-bold">· 0.1° cells</strong>
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              Resolution values describe the instruments. The grid and HAI are FireDNA prototype methods, not NASA products.
            </p>
          </aside>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2D8A64]">Regional overview</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#10243A] sm:text-2xl">Fire activity at a glance</h2>
            <p className="mt-1 text-sm text-slate-500">Satellite observations across Bangladesh and South Asia</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${summary.is_demo_data ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${summary.is_demo_data ? "bg-amber-500" : "bg-emerald-500"}`} />
              {summary.is_demo_data ? "Synthetic demo data" : "NASA FIRMS observations"}
            </span>
            {summary.latest_observation && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                Latest observation · {summary.latest_observation}
              </span>
            )}
          </div>
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
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        
        {/* Card 1: Map Entry */}
        <div className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/5 motion-reduce:transition-none">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#FF9F43] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Interactive Satellite Fire Map</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Visualize thermal hotspots detected across Bangladesh, Chittagong Hill Tracts, and the Sundarbans with custom layer toggles for MODIS and VIIRS.
            </p>
          </div>
          <Link
            href="/map"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#C76A13] transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43] focus-visible:ring-offset-2"
          >
            <span>Launch Full Screen Map</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Card 2: Sensor Lab */}
        <div className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-950/5 motion-reduce:transition-none">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#3783A8] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Sensor Comparison Lab</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Why does VIIRS report 5x more fire points than MODIS for the exact same fire? Step inside our laboratory to examine side-by-side satellite optics.
            </p>
          </div>
          <Link
            href="/compare"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3783A8] transition-colors hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67B7E1] focus-visible:ring-offset-2"
          >
            <span>Enter Comparison Lab</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Card 3: Calendar & Anomalies */}
        <div className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5 motion-reduce:transition-none">
          <div className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#2D8A64] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[#10243A]">Fire Calendar & Anomalies</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track 365 days of seasonal crop residue burning and examine unusual fire events using statistical Z-scores and climatological baselines.
            </p>
          </div>
          <Link
            href="/calendar"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#2D8A64] transition-colors hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8A64] focus-visible:ring-offset-2"
          >
            <span>View Fire Calendar</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
