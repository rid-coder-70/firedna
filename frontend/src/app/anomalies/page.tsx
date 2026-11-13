import { getAnomalySummary } from "@/lib/api";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/MotionWrapper";

export default async function AnomaliesPage() {
  const summary = await getAnomalySummary();

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "extreme":
        return (
          <span className="bg-[#FF6B2B] text-white px-2.5 py-0.5 rounded-md text-[11px] font-bold">
            Extreme (Z ≥ 3.5)
          </span>
        );
      case "high":
        return (
          <span className="bg-[#FFF2EB] text-[#FF6B2B] border border-[#FF6B2B]/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
            High (Z 2.5–3.5)
          </span>
        );
      case "elevated":
        return (
          <span className="bg-[#EFECE1] text-[#10243A] px-2.5 py-0.5 rounded-md text-[11px] font-semibold">
            Elevated (Z 1.5–2.5)
          </span>
        );
      default:
        return (
          <span className="bg-[#10243A]/10 text-[#10243A] px-2.5 py-0.5 rounded-md text-[11px] font-medium">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <FadeIn>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">
              Anomaly Explorer
            </h1>
            <p className="text-xs sm:text-sm text-[#4A607A]">
              Statistical detection of unusual fire activity using historical monthly baselines and Z-scores.
            </p>
          </div>
        </div>

        {/* Mandatory Scientific Transparency Alert */}
        <div className="p-4 bg-[#FFF2EB] rounded-xl border border-[#FF6B2B]/30 text-xs text-[#10243A] leading-relaxed flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 text-[#FF6B2B] shrink-0 mt-0.5" />
          <p>
            <strong>Scientific Integrity Statement:</strong> Statistical anomalies indicate that satellite-detected fire
            counts in a cell significantly exceed the historical average for that calendar month.
            <strong> An anomaly does NOT confirm a dangerous wildfire.</strong> Concentrated agricultural residue burning or land clearing
            can trigger high Z-scores.
          </p>
        </div>
      </div>
      </FadeIn>

      {/* Anomaly Distribution KPI Grid */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StaggerItem hoverLift className="bg-[#FCFBF7] p-4 sm:p-5 rounded-2xl border border-[#E2DEC9] shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A607A]">
            Normal Variation
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#10243A] mt-1">
            {(summary.level_counts.normal || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#4A607A] mt-1">Z-score &lt; 1.5</p>
        </StaggerItem>
        <StaggerItem hoverLift className="bg-[#FCFBF7] p-4 sm:p-5 rounded-2xl border border-[#E2DEC9] shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A607A]">
            Elevated Activity
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#10243A] mt-1">
            {(summary.level_counts.elevated || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#4A607A] mt-1">Z-score 1.5 – 2.5</p>
        </StaggerItem>
        <StaggerItem hoverLift className="bg-[#FCFBF7] p-4 sm:p-5 rounded-2xl border border-[#E2DEC9] shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A607A]">
            Unusually High
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#FF9F43] mt-1">
            {(summary.level_counts.high || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#4A607A] mt-1">Z-score 2.5 – 3.5</p>
        </StaggerItem>
        <StaggerItem hoverLift className="bg-[#FCFBF7] p-4 sm:p-5 rounded-2xl border border-[#E2DEC9] shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A607A]">
            Extremely Unusual
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#FF6B2B] mt-1">
            {(summary.level_counts.extreme || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#4A607A] mt-1">Z-score ≥ 3.5</p>
        </StaggerItem>
      </StaggerContainer>

      {/* Top Anomalies Table */}
      <FadeIn delay={0.08}>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#10243A]">
            Top Statistically Unusual Grid Cells
          </h2>
          <p className="text-xs text-[#4A607A]">
            Ranked by standard deviations above historical monthly mean (Z-Score)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2DEC9] text-[#4A607A] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Grid Cell</th>
                <th className="py-3 px-3">Coordinates</th>
                <th className="py-3 px-3">Observed</th>
                <th className="py-3 px-3">Baseline (μ ± σ)</th>
                <th className="py-3 px-3">Z-Score</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DEC9]/60 text-[#10243A]">
              {summary.top_anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-[#F7F6EF] transition-colors">
                  <td className="py-3.5 px-3 font-semibold">{String(a.obs_date)}</td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-[#4A607A]">
                    {a.grid_cell_id}
                  </td>
                  <td className="py-3.5 px-3">
                    {a.centroid_lat.toFixed(2)}°N, {a.centroid_lon.toFixed(2)}°E
                  </td>
                  <td className="py-3.5 px-3 font-bold">{a.observed_count} hotspots</td>
                  <td className="py-3.5 px-3 text-[#4A607A]">
                    {a.baseline_mean_count?.toFixed(1)} ± {a.baseline_std_count?.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-3 font-extrabold text-[#FF6B2B]">
                    +{a.z_score?.toFixed(2)}σ
                  </td>
                  <td className="py-3.5 px-3">{getLevelBadge(a.anomaly_level)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </FadeIn>

      {/* Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="How does Z-score anomaly detection work?"
          shortAnswer="A Z-score measures how many standard deviations an observation is above the historical average for that calendar month."
          detailedAnswer="Formula: Z = (Observed - Baseline Mean) / Baseline Standard Deviation. If a cell typically sees 2 fires in November with a standard deviation of 1, and today sees 9 fires, its Z-score is +7.0σ."
          tag="Mathematics"
          defaultExpanded={true}
        />

        <EducationCard
          question="What happens if a cell has no historical data?"
          shortAnswer="FireDNA flags the cell as 'insufficient_data' rather than inventing false alarms."
          detailedAnswer="If a grid cell has fewer than 3 years of satellite history or zero standard deviation, statistical Z-scores cannot be reliably determined."
          tag="Reliability"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}
