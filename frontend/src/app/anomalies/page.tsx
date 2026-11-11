import { getAnomalySummary } from "@/lib/api";
import { AlertTriangle, ShieldAlert, Sparkles, Activity, CheckCircle, HelpCircle } from "lucide-react";
import EducationCard from "@/components/education/EducationCard";

export default async function AnomaliesPage() {
  const summary = await getAnomalySummary();

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "extreme":
        return <span className="bg-red-100 text-red-800 border border-red-300 px-2 py-0.5 rounded-full text-xs font-bold">Extreme Anomaly (Z ≥ 3.5)</span>;
      case "high":
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5 rounded-full text-xs font-bold">High Anomaly (Z 2.5 - 3.5)</span>;
      case "elevated":
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-xs font-semibold">Elevated (Z 1.5 - 2.5)</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium">Normal Variation</span>;
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E85D5D] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">Anomaly Explorer</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Statistical detection of unusual fire activity using historical monthly baselines and Z-scores.
            </p>
          </div>
        </div>

        {/* Mandatory Scientific Transparency Alert */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Scientific Integrity Statement:</strong> Statistical anomalies indicate that the satellite-detected fire 
            counts in a cell significantly exceed the historical average for that calendar month. 
            <strong> An anomaly does NOT confirm a dangerous wildfire.</strong> Concentrated agricultural residue burning or land clearing 
            can trigger high Z-scores. Always consult local disaster management agencies for verified ground-truth fire reports.
          </p>
        </div>
      </div>

      {/* Anomaly Distribution KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Normal Variation</p>
          <p className="text-2xl font-extrabold text-[#2D8A64] mt-1">{summary.level_counts.normal || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Z-score &lt; 1.5</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Elevated Activity</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{summary.level_counts.elevated || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Z-score 1.5 – 2.5</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Unusually High</p>
          <p className="text-2xl font-extrabold text-[#FF9F43] mt-1">{summary.level_counts.high || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Z-score 2.5 – 3.5</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-400">Extremely Unusual</p>
          <p className="text-2xl font-extrabold text-[#E85D5D] mt-1">{summary.level_counts.extreme || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Z-score ≥ 3.5</p>
        </div>
      </div>

      {/* Top Anomalies Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#10243A]">Top Statistically Unusual Grid Cells</h2>
          <p className="text-xs text-slate-500">Ranked by standard deviations above historical monthly mean (Z-Score)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Grid Cell</th>
                <th className="py-3 px-3">Coordinates</th>
                <th className="py-3 px-3">Observed Detections</th>
                <th className="py-3 px-3">Historical Baseline (μ ± σ)</th>
                <th className="py-3 px-3">Z-Score</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.top_anomalies.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-900">{a.obs_date}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{a.grid_cell_id}</td>
                  <td className="py-3 px-3">{a.centroid_lat.toFixed(2)}°N, {a.centroid_lon.toFixed(2)}°E</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{a.observed_count} hotspots</td>
                  <td className="py-3 px-3 text-slate-500">
                    {a.baseline_mean_count?.toFixed(1)} ± {a.baseline_std_count?.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900">
                    +{a.z_score?.toFixed(2)}σ
                  </td>
                  <td className="py-3 px-3">
                    {getLevelBadge(a.anomaly_level)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EducationCard
          question="How does Z-score anomaly detection work?"
          shortAnswer="A Z-score measures how many standard deviations an observation is above the historical average for that specific calendar month."
          detailedAnswer="Formula: Z = (Observed - Baseline Mean) / Baseline Standard Deviation. If a cell typically sees 2 fires in November with a standard deviation of 1, and today sees 9 fires, its Z-score is (9 - 2) / 1 = +7.0σ. This mathematically flags the event as an extreme statistical outlier."
          tag="Mathematics"
          defaultExpanded={true}
        />

        <EducationCard
          question="What happens if a cell has no historical data?"
          shortAnswer="FireDNA flags the cell as 'insufficient_data' rather than inventing false alarms."
          detailedAnswer="If a grid cell has fewer than 3 years of satellite history or zero standard deviation, statistical Z-scores cannot be reliably determined. FireDNA marks these cells safely with an 'insufficient_data' status to prevent false panic."
          tag="Reliability"
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}

