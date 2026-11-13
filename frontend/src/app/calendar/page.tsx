import { Calendar, Info } from "lucide-react";
import CalendarHeatmap from "@/components/calendar/CalendarHeatmap";
import EducationCard from "@/components/education/EducationCard";
import { FadeIn } from "@/components/ui/MotionWrapper";
import { getDailyAnalytics, getMonthlyAnalytics } from "@/lib/api";

export default async function CalendarPage() {
  const [dailyData, monthlyData] = await Promise.all([
    getDailyAnalytics(),
    getMonthlyAnalytics(),
  ]);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <FadeIn>
      <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 shrink-0" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-[#10243A]">
              Fire Activity Calendar
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-[#4A607A]">
              Live daily NASA FIRMS fire detection telemetry and seasonal burning calendar across South Asia.
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#F7F6EF] rounded-xl border border-[#E2DEC9] text-xs text-[#10243A] leading-relaxed flex items-start gap-2.5 sm:gap-3">
          <Info className="w-4 h-4 text-[#FF6B2B] shrink-0 mt-0.5" />
          <p className="min-w-0 flex-1">
            <strong>Climatological Context:</strong> Across South Asia, fire activity follows two distinct seasonal spikes:
            the <strong>Pre-Monsoon Dry Season (March – May)</strong> and <strong>Post-Monsoon Harvest Residue Burning (October – November)</strong>.
            During the summer monsoon (June – August), cloud cover and intense rain suppress satellite detections.
          </p>
        </div>
      </div>
      </FadeIn>

      {/* Live Daily Telemetry Matrix */}
      <FadeIn delay={0.06}>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DEC9] pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#10243A]">
              Observed Satellite Burning Activity (2026)
            </h2>
            <p className="text-xs text-[#4A607A]">
              Powered directly by official NASA MODIS C6.1 &amp; VIIRS C2 South Asia observations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-[#4A607A]">Region:</span>
            <span className="bg-[#10243A] text-[#F7F6EF] text-xs font-semibold px-3 py-1 rounded-full">
              South Asia
            </span>
          </div>
        </div>

        <CalendarHeatmap dailyData={dailyData} monthlyData={monthlyData} />
      </div>
      </FadeIn>

      {/* Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="Why do fires peak in March–May and October–November?"
          shortAnswer="These windows match regional agricultural harvesting and dry pre-monsoon heat."
          detailedAnswer="Farmers across the Indo-Gangetic Plains and South Asia clear crop residues before sowing winter wheat or summer crops, while dry forest floors become flammable during pre-monsoon heatwaves."
          tag="Agronomy"
          defaultExpanded={true}
        />

        <EducationCard
          question="Can satellites see fires through clouds and monsoons?"
          shortAnswer="No. Optical and infrared sensors cannot penetrate thick rain clouds."
          detailedAnswer="During the June–August monsoon, cloud cover prevents MODIS and VIIRS from viewing the surface. Even if an industrial flare or small fire occurs under a rain cloud, it will not appear in the satellite record."
          tag="Atmosphere"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}
