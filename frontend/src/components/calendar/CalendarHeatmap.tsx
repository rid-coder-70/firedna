"use client";

import { useMemo, useState } from "react";
import { Calendar as CalIcon, Flame, Layers, Activity } from "lucide-react";
import { DailyAnalytics, MonthlyAnalytics } from "@/lib/types";

interface CalendarHeatmapProps {
  dailyData: DailyAnalytics[];
  monthlyData: MonthlyAnalytics[];
}

interface CalendarDayCell {
  date: string;
  month: number;
  count: number;
  modisCount: number;
  viirsCount: number;
  totalFrp: number;
  haiMean: number | null;
  hasData: boolean;
}

export default function CalendarHeatmap({
  dailyData,
  monthlyData,
}: CalendarHeatmapProps) {
  const [viewMode, setViewMode] = useState<"window" | "annual">("window");

  // Map real backend daily analytics by YYYY-MM-DD
  const dailyMap = useMemo(() => {
    const map = new Map<string, DailyAnalytics>();
    (dailyData || []).forEach((d) => {
      map.set(String(d.date), d);
    });
    return map;
  }, [dailyData]);

  // Default selected day to the peak real observation day
  const defaultDay = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return null;
    return [...dailyData].sort((a, b) => b.total_count - a.total_count)[0];
  }, [dailyData]);

  const [selectedDate, setSelectedDate] = useState<string | null>(
    defaultDay ? String(defaultDay.date) : null
  );

  // Build 365-day 2026 calendar matrix strictly from real observations (0 where uningested)
  const annualDays: CalendarDayCell[] = useMemo(() => {
    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.UTC(2026, 0, i + 1));
      const iso = d.toISOString().split("T")[0];
      const real = dailyMap.get(iso);
      cells.push({
        date: iso,
        month: d.getUTCMonth(),
        count: real ? real.total_count : 0,
        modisCount: real ? real.modis_count : 0,
        viirsCount: real ? real.viirs_count : 0,
        totalFrp: real ? Math.round(real.total_frp_modis + real.total_frp_viirs) : 0,
        haiMean: real?.hai_mean ?? null,
        hasData: Boolean(real),
      });
    }
    return cells;
  }, [dailyMap]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxDailyCount = useMemo(
    () => Math.max(1, ...(dailyData || []).map((d) => d.total_count)),
    [dailyData]
  );

  const getColor = (count: number, hasData: boolean) => {
    if (!hasData || count === 0) return "bg-[#EFECE1] border border-[#E2DEC9]/70";
    const ratio = count / maxDailyCount;
    if (ratio < 0.25) return "bg-[#10243A]/25";
    if (ratio < 0.5) return "bg-[#10243A]";
    if (ratio < 0.75) return "bg-[#FF9F43]";
    return "bg-[#FF6B2B]";
  };

  const selectedRecord = selectedDate ? dailyMap.get(selectedDate) : defaultDay;
  const activeMonths = (monthlyData || []).filter((m) => m.total_count > 0);

  return (
    <div className="space-y-6">
      {/* View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("window")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              viewMode === "window"
                ? "bg-[#10243A] text-[#F7F6EF] shadow-sm"
                : "text-[#4A607A] hover:text-[#10243A]"
            }`}
          >
            Active Satellite Window ({dailyData.length} Days)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("annual")}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              viewMode === "annual"
                ? "bg-[#10243A] text-[#F7F6EF] shadow-sm"
                : "text-[#4A607A] hover:text-[#10243A]"
            }`}
          >
            Annual 2026 Calendar Grid
          </button>
        </div>

        {activeMonths.length > 0 && (
          <div className="text-xs text-[#4A607A]">
            Ingested Months:{" "}
            <strong className="text-[#10243A]">
              {activeMonths.map((m) => `${m.month_name} (${m.total_count.toLocaleString()})`).join(", ")}
            </strong>
          </div>
        )}
      </div>

      {/* Mode 1: Active Satellite Window Daily Cards */}
      {viewMode === "window" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {dailyData.map((d) => {
            const isSelected = String(d.date) === String(selectedRecord?.date);
            const totalFrp = Math.round(d.total_frp_modis + d.total_frp_viirs);
            const intensityPct = Math.min(100, Math.round((d.total_count / maxDailyCount) * 100));

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(String(d.date))}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-[#10243A] text-[#F7F6EF] border-[#10243A] shadow-md"
                    : "bg-[#F7F6EF] text-[#10243A] border-[#E2DEC9] hover:border-[#10243A]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#FF9F43]" : "text-[#4A607A]"}`}>
                    {d.date}
                  </span>
                  <Flame className="w-4 h-4 text-[#FF6B2B]" />
                </div>

                <div className="mt-2 text-2xl font-extrabold">
                  {d.total_count.toLocaleString()}
                  <span className={`ml-1.5 text-[11px] font-medium ${isSelected ? "text-[#F7F6EF]/70" : "text-[#4A607A]"}`}>
                    hotspots
                  </span>
                </div>

                <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#E2DEC9]/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#FF6B2B]"
                    style={{ width: `${intensityPct}%` }}
                  />
                </div>

                <div className={`mt-3 flex items-center justify-between text-[11px] ${isSelected ? "text-[#F7F6EF]/80" : "text-[#4A607A]"}`}>
                  <span>MODIS: <strong>{d.modis_count}</strong></span>
                  <span>VIIRS: <strong>{d.viirs_count.toLocaleString()}</strong></span>
                  <span>{totalFrp.toLocaleString()} MW</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mode 2: Full 365-Day Annual Matrix (Zero synthetic data: uningested days = 0) */}
      {viewMode === "annual" && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 text-center text-xs font-bold text-[#4A607A] pb-1">
            {monthNames.map((m) => (
              <div key={m}>{m}</div>
            ))}
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[700px]">
              {annualDays.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 focus:outline-none ${getColor(d.count, d.hasData)} ${
                    selectedDate === d.date ? "ring-2 ring-[#FF6B2B] scale-125 z-10" : ""
                  }`}
                  title={
                    d.hasData
                      ? `${d.date}: ${d.count.toLocaleString()} NASA FIRMS detections`
                      : `${d.date}: No ingested observations`
                  }
                  aria-label={`${d.date}: ${d.count} hotspots`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend & Selected Day Detailed Inspection */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-[#E2DEC9] text-xs">
        <div className="flex items-center space-x-2 text-[#4A607A] font-medium">
          <span>No Data / 0</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-sm bg-[#EFECE1] border border-[#E2DEC9]" />
            <span className="w-3 h-3 rounded-sm bg-[#10243A]/25" />
            <span className="w-3 h-3 rounded-sm bg-[#10243A]" />
            <span className="w-3 h-3 rounded-sm bg-[#FF9F43]" />
            <span className="w-3 h-3 rounded-sm bg-[#FF6B2B]" />
          </div>
          <span>Peak Activity</span>
        </div>

        {selectedRecord ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#F7F6EF] border border-[#E2DEC9] px-4 py-2.5 rounded-xl text-[#10243A]">
            <CalIcon className="w-4 h-4 text-[#FF6B2B] shrink-0" />
            <span>
              <strong>{selectedRecord.date}:</strong> {selectedRecord.total_count.toLocaleString()} detections
            </span>
            <span className="text-[#E2DEC9]">•</span>
            <span className="inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#DC2626]" />
              MODIS: <strong>{selectedRecord.modis_count}</strong>
            </span>
            <span className="text-[#E2DEC9]">•</span>
            <span className="inline-flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#FF6B2B]" />
              VIIRS: <strong>{selectedRecord.viirs_count.toLocaleString()}</strong>
            </span>
            <span className="text-[#E2DEC9]">•</span>
            <span>
              Total FRP: <strong>{Math.round(selectedRecord.total_frp_modis + selectedRecord.total_frp_viirs).toLocaleString()} MW</strong>
            </span>
            {typeof selectedRecord.hai_mean === "number" && (
              <>
                <span className="text-[#E2DEC9]">•</span>
                <span className="text-[#2563EB] font-bold">
                  Mean HAI: {selectedRecord.hai_mean.toFixed(3)}
                </span>
              </>
            )}
          </div>
        ) : (
          <span className="text-[#4A607A] italic">
            Select any date tile above to inspect real NASA FIRMS daily metrics.
          </span>
        )}
      </div>
    </div>
  );
}
