import { Calendar, Flame, Sparkles, Filter, Info } from "lucide-react";
import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";
import EducationCard from "@/components/education/EducationCard";

export default function CalendarPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2D8A64] flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">Fire Activity Calendar</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              365-day annual heatmap displaying daily satellite fire observations and seasonal agricultural burning patterns.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start space-x-3">
          <Info className="w-4 h-4 text-[#67B7E1] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Climatological Context:</strong> In Bangladesh and South Asia, fire activity follows two distinct seasonal spikes:
            the <strong>Pre-Monsoon Dry Season (March – May)</strong> and the <strong>Post-Monsoon Harvest Residue Burning (October – November)</strong>.
            During the summer monsoon (June – August), cloud cover and intense rain suppress fire detections to near zero.
          </p>
        </div>
      </div>

      {/* Heatmap Matrix Component */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#10243A]">Daily Burning Heatmap (2026)</h2>
            <p className="text-xs text-slate-500">Interactive matrix: Click any day to inspect satellite detection counts</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Region:</span>
            <span className="bg-slate-100 text-[#10243A] text-xs font-semibold px-2.5 py-1 rounded-full">
              Bangladesh & S. Asia
            </span>
          </div>
        </div>

        <CalendarHeatmap />
      </div>

      {/* Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="Why do fires peak in March-May and October-November?"
          shortAnswer="These windows match regional agricultural harvesting and dry pre-monsoon heat."
          detailedAnswer="Farmers in South Asia clear crop residues before sowing new crops (e.g. Aman and Boro rice). In addition, dry forest floors in the Chittagong Hill Tracts and surrounding borders become flammable during pre-monsoon heatwaves before the monsoon rains arrive in June."
          tag="Agronomy"
          defaultExpanded={true}
        />

        <EducationCard
          question="Can satellites see fires through clouds and monsoons?"
          shortAnswer="No. Optical and infrared sensors cannot penetrate thick rain clouds."
          detailedAnswer="During the June-August monsoon, cloud cover prevents MODIS and VIIRS from viewing the surface. Even if an industrial flare or small fire occurs under a rain cloud, it will not appear in the satellite record. This is a fundamental physical limitation of spaceborne infrared sensors."
          tag="Atmosphere"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}

