"use client";

import { useState } from "react";
import { Flame, Calendar as CalIcon } from "lucide-react";

interface DayData {
  date: string;
  dayOfYear: number;
  month: number;
  count: number;
  dominantSensor: string;
  maxFrp: number;
}

export default function CalendarHeatmap() {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Generate 365 days of synthetic seasonal activity for 2026
  const days: DayData[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 365; i++) {
    const d = new Date(2026, 0, i + 1);
    const month = d.getMonth(); // 0 - 11

    // Seasonal curve for South Asia:
    // Peak 1: March-April (months 2, 3)
    // Monsoon dip: June-August (months 5, 6, 7) -> counts near 0-5
    // Peak 2: October-November (months 9, 10)
    let baseCount = 15;
    if (month === 2 || month === 3) {
      baseCount = 85 + (i % 45); // Pre-monsoon peak
    } else if (month >= 5 && month <= 7) {
      baseCount = Math.max(2, (i % 6)); // Monsoon minimum
    } else if (month === 9 || month === 10) {
      baseCount = 55 + (i % 35); // Post-harvest peak
    } else {
      baseCount = 20 + (i % 15);
    }

    days.push({
      date: d.toISOString().split("T")[0],
      dayOfYear: i + 1,
      month: month,
      count: baseCount,
      dominantSensor: baseCount > 40 ? "VIIRS (375m)" : "MODIS (~1km)",
      maxFrp: Math.round(baseCount * 1.4),
    });
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-100";
    if (count < 15) return "bg-emerald-100";
    if (count < 35) return "bg-amber-200";
    if (count < 65) return "bg-[#FF9F43]";
    if (count < 95) return "bg-orange-500";
    return "bg-[#E85D5D]";
  };

  return (
    <div className="space-y-6">
      
      {/* Month Header row */}
      <div className="grid grid-cols-12 text-center text-xs font-semibold text-slate-500 pb-1">
        {monthNames.map((m) => (
          <div key={m}>{m}</div>
        ))}
      </div>

      {/* Calendar Grid: 53 columns x 7 days */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[700px]">
          {days.map((d) => (
            <button
              key={d.date}
              onClick={() => setSelectedDay(d)}
              className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 focus:outline-none ${getColor(d.count)} ${
                selectedDay?.date === d.date ? "ring-2 ring-slate-900 scale-125 z-10" : ""
              }`}
              title={`${d.date}: ${d.count} detections`}
              aria-label={`${d.date}: ${d.count} hotspots`}
            />
          ))}
        </div>
      </div>

      {/* Legend & Selected Day Inspection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
        {/* Heatmap Legend */}
        <div className="flex items-center space-x-2 text-slate-600">
          <span>Fewer Hotspots</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-100" />
            <span className="w-3 h-3 rounded-sm bg-amber-200" />
            <span className="w-3 h-3 rounded-sm bg-[#FF9F43]" />
            <span className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="w-3 h-3 rounded-sm bg-[#E85D5D]" />
          </div>
          <span>More Hotspots</span>
        </div>

        {/* Selected Day Inspector */}
        {selectedDay ? (
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-800">
            <CalIcon className="w-4 h-4 text-[#2D8A64]" />
            <span><strong>{selectedDay.date}:</strong> {selectedDay.count} hotspots</span>
            <span className="text-slate-400">•</span>
            <span>Max FRP: <strong>{selectedDay.maxFrp} MW</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-[#FF9F43] font-semibold">{selectedDay.dominantSensor}</span>
          </div>
        ) : (
          <span className="text-slate-400 italic">Click on any square cell above to inspect daily satellite metrics.</span>
        )}
      </div>
    </div>
  );
}

