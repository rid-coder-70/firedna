import { getDailyAnalytics, getMonthlyAnalytics, getSeasonalAnalytics, EXPORT_ANALYTICS_CSV_URL } from "@/lib/api";
import { BarChart2, Download } from "lucide-react";
import AnalyticsCharts from "@/components/charts/AnalyticsCharts";
import EducationCard from "@/components/education/EducationCard";
import { FadeIn } from "@/components/ui/MotionWrapper";

export default async function AnalyticsPage() {
  const dailySeries = await getDailyAnalytics();
  const monthlyDist = await getMonthlyAnalytics();
  const seasonalDist = await getSeasonalAnalytics();

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <FadeIn>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">
              Activity Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[#4A607A]">
              Multi-satellite statistical trends, monthly climatology, and seasonal burning distributions.
            </p>
          </div>
        </div>

        <a
          href={EXPORT_ANALYTICS_CSV_URL}
          download
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#10243A] hover:bg-[#1E3A5F] text-[#F7F6EF] text-xs font-semibold shadow-sm transition-colors self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#FF6B2B]" />
          <span>Download Analytics CSV</span>
        </a>
      </div>
      </FadeIn>

      {/* Main Charts Component */}
      <FadeIn delay={0.06}>
      <AnalyticsCharts
        dailyData={dailySeries}
        monthlyData={monthlyDist}
        seasonalData={seasonalDist}
      />
      </FadeIn>

      {/* Educational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="Why are most fires detected during the daytime?"
          shortAnswer="Farmers conduct intentional burns during dry daytime hours, and daytime winds stimulate fire spread."
          detailedAnswer="Satellites make daytime passes around 10:30 AM (Terra) and 1:30 PM (Aqua & Suomi-NPP) local solar time, coinciding with the peak hours of agricultural stubble burning and maximum solar heating."
          tag="Diurnal Cycle"
          defaultExpanded={true}
        />

        <EducationCard
          question="How does FireDNA handle zero-fire days?"
          shortAnswer="Zero detections are preserved as genuine zero values, not missing data or calculation errors."
          detailedAnswer="In climatology and statistics, knowing that zero fires burned is as important as measuring a peak. FireDNA's harmonization engine explicitly distinguishes between 'zero fires detected under clear skies' and 'no data due to orbit gaps'."
          tag="Statistics"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}
