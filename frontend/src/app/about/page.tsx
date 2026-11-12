import { Globe, Shield, Award } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";

export default function AboutPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Minimal Hero Header (30% Navy Structural Block) */}
      <div className="bg-[#10243A] text-[#F7F6EF] p-8 sm:p-12 rounded-3xl shadow-md space-y-4">
        <div className="inline-flex items-center space-x-2 bg-[#FF6B2B] px-3 py-1 rounded-full text-xs font-bold text-white">
          <Award className="w-3.5 h-3.5" />
          <span>NASA Space Apps Challenge 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          About Fire<span className="text-[#FF6B2B]">DNA</span>
        </h1>

        <p className="text-base sm:text-lg text-[#F7F6EF]/80 max-w-2xl leading-relaxed">
          <strong className="text-white">Understand Fire. Connect Data. Protect Our Planet.</strong> <br />
          FireDNA was created to solve a fundamental challenge in satellite environmental observation:
          how to fairly harmonize, compare, and understand fire data across multiple satellites with different optical eyes.
        </p>
      </div>

      {/* The Core Challenge & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-[#10243A]">The Problem</h2>
          <p className="text-sm text-[#4A607A] leading-relaxed">
            For decades, NASA&apos;s MODIS provided consistent 1 km global fire detections. Starting in 2012, VIIRS introduced sharp 375 m imagery.
            Because of this resolution leap, VIIRS detects up to 6 times more hotspots for the same fire.
            Without standardization, students and policy makers are often misled into believing fire activity has suddenly exploded,
            when in reality, the satellite merely got sharper glasses.
          </p>
        </div>

        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#10243A] text-[#FF9F43] flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-[#10243A]">The FireDNA Solution</h2>
          <p className="text-sm text-[#4A607A] leading-relaxed">
            FireDNA projects raw observations onto a standardized <strong className="text-[#10243A]">0.1° (~11 km) equal-interval grid</strong>.
            Within each cell, we normalize detection density and Fire Radiative Power (FRP) independently, computing
            an intuitive <strong className="text-[#10243A]">Harmonized Activity Index (HAI)</strong>. This allows scientists, disaster responders,
            and learners to compare activity fairly across satellites.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#10243A]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#4A607A]">
            Everything you need to know about satellite fire monitoring
          </p>
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
            detailedAnswer="The spatial gridding algorithms accept any latitude-longitude bounding box. While Bangladesh is our primary demonstration region, FireDNA can ingest and harmonize active fires anywhere on Earth."
            tag="Scalability"
            defaultExpanded={true}
          />
        </div>
      </div>

      {/* Technical Stack Summary */}
      <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#10243A]">
          Built with Open Source Technologies
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "Next.js 14 App Router",
            "TypeScript",
            "Tailwind CSS (60/30/10 Minimal)",
            "Leaflet GIS",
            "Recharts",
            "FastAPI (Python)",
            "SQLAlchemy 2.0",
            "NASA FIRMS API",
          ].map((tech) => (
            <span
              key={tech}
              className="bg-[#F7F6EF] border border-[#E2DEC9] text-[#10243A] font-semibold px-3 py-1.5 rounded-xl"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
