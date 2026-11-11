import { getDailyAnalytics, getMonthlyAnalytics, getSeasonalAnalytics, EXPORT_ANALYTICS_CSV_URL } from "@/lib/api";
import { BarChart2, TrendingUp, Calendar, Download, Sparkles, Sun, Moon } from "lucide-react";
import AnalyticsCharts from "@/components/charts/AnalyticsCharts";
import EducationCard from "@/components/education/EducationCard";

export default async function AnalyticsPage() {
  const dailySeries = await getDailyAnalytics();
  const monthlyDist = await getMonthlyAnalytics();
  const seasonalDist = await getSeasonalAnalytics();

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#67B7E1] flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-[#10243A]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">Activity Analytics</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Multi-satellite statistical trends, monthly climatology, and diurnal burning distributions.
              </p>
            </div>
          </div>
        </div>

        <a
          href={EXPORT_ANALYTICS_CSV_URL}
          download
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#2D8A64] hover:bg-[#236e4f] text-white text-xs font-semibold shadow-sm transition-colors self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Analytics CSV</span>
        </a>
      </div>

      {/* Main Charts Component */}
      <AnalyticsCharts
        dailyData={dailySeries}
        monthlyData={monthlyDist}
        seasonalData={seasonalDist}
      />

      {/* Educational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="Why are most fires detected during the daytime?"
          shortAnswer="Farmers conduct intentional burns during dry daytime hours, and daytime winds stimulate fire spread."
          detailedAnswer="Satellites make daytime passes around 10:30 AM (Terra) and 1:30 PM (Aqua & Suomi-NPP) local solar time, coinciding with the peak hours of agricultural stubble burning and maximum solar heating. Nighttime overpasses (10:30 PM and 1:30 AM) detect smoldering fires and intense industrial sources."
          tag="Diurnal Cycle"
          defaultExpanded={true}
        />

        <EducationCard
          question="How does FireDNA handle zero-fire days?"
          shortAnswer="Zero detections are preserved as genuine zero values, not missing data or calculation errors."
          detailedAnswer="In climatology and statistics, knowing that zero fires burned is as important as measuring a peak. FireDNA's harmonization engine explicitly distinguishes between 'zero fires detected under clear skies' and 'no data due to satellite orbit or transmission gaps'."
          tag="Statistics"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}

