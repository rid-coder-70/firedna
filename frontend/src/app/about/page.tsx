import { Flame, Sparkles, Globe, Heart, Shield, Award, Terminal } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";

export default function AboutPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#10243A] via-[#163352] to-[#0B1928] text-white p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-700/60 space-y-4">
        <div className="inline-flex items-center space-x-2 bg-[#FF9F43]/20 border border-[#FF9F43]/40 px-3 py-1 rounded-full text-xs font-semibold text-[#FF9F43]">
          <Award className="w-3.5 h-3.5" />
          <span>NASA Space Apps Challenge 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          About Fire<span className="text-[#FF9F43]">DNA</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          <strong>Understand Fire. Connect Data. Protect Our Planet.</strong> <br />
          FireDNA was created to solve a fundamental challenge in satellite environmental observation: 
          how to fairly harmonize, compare, and understand fire data across multiple satellites with different optical eyes.
        </p>
      </div>

      {/* The Core Challenge & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* The Problem */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E85D5D] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#10243A]">The Problem</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            For decades, NASA&apos;s MODIS provided consistent 1 km global fire detections. Starting in 2012, VIIRS introduced sharp 375 m imagery. 
            Because of this resolution leap, VIIRS detects up to 6 times more hotspots for the same fire. 
            Without standardization, students and policy makers are often misled into believing fire activity has suddenly exploded, 
            when in reality, the satellite merely got sharper glasses.
          </p>
        </div>

        {/* The FireDNA Solution */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D8A64] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#10243A]">The FireDNA Solution</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            FireDNA projects raw observations onto a standardized <strong>0.1° (~11 km) equal-interval grid</strong>. 
            Within each cell, we normalize detection density and Fire Radiative Power (FRP) independently, computing 
            an intuitive <strong>Harmonized Activity Index (HAI)</strong>. This allows scientists, disaster responders, 
            and learners to compare activity fairly across satellites.
          </p>
        </div>
      </div>

      {/* Interactive FAQ & Educational Guide */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#10243A]">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Everything you need to know about satellite fire monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EducationCard
            question="Why is Bangladesh and South Asia the focus?"
            shortAnswer="South Asia experiences intense seasonal biomass burning and diverse agro-ecological zones."
            detailedAnswer="From shifting cultivation in the Chittagong Hill Tracts to post-harvest crop residue burning across the Ganges plains, Bangladesh provides a dense, real-world testing ground for cross-sensor satellite harmonization."
            tag="Geography"
            defaultExpanded={true}
          />

          <EducationCard
            question="Can FireDNA be used for other countries?"
            shortAnswer="Yes. The architecture is fully geographic and supports global coordinates."
            detailedAnswer="The PostGIS database and spatial gridding algorithms accept any latitude-longitude bounding box. While Bangladesh is our primary demonstration region, FireDNA can ingest and harmonize active fires for North America, the Amazon, Australia, or anywhere on Earth."
            tag="Scalability"
            defaultExpanded={true}
          />
        </div>
      </div>

      {/* Technical Stack Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[#10243A]">Built with Open Source Technologies</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">Next.js 14 App Router</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">TypeScript</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">Tailwind CSS</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">Leaflet & React Leaflet</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">Recharts</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">FastAPI (Python 3.12)</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">PostgreSQL & PostGIS</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">SQLAlchemy 2.0</span>
          <span className="bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl">Docker & Docker Compose</span>
        </div>
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          FireDNA is an open-source project released under the MIT License for educational, environmental, and humanitarian research.
        </p>
      </div>
    </div>
  );
}

