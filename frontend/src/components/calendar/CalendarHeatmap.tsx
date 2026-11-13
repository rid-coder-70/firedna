"use client";

import { useState } from "react";
import { Calendar as CalIcon } from "lucide-react";

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

  const days: DayData[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < 365; i++) {
    const d = new Date(2026, 0, i + 1);
    const month = d.getMonth();

    let baseCount = 15;
    if (month === 2 || month === 3) {
      baseCount = 85 + (i % 45);
    } else if (month >= 5 && month <= 7) {
      baseCount = Math.max(2, i % 6);
    } else if (month === 9 || month === 10) {
      baseCount = 55 + (i % 35);
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

  // Strict 60/30/10 Heatmap Palette (Cream -> Navy -> Fire Orange/Red)
  const getColor = (count: number) => {
    if (count < 10) return "bg-[#EFECE1]";
    if (count < 30) return "bg-[#10243A]/25";
    if (count < 55) return "bg-[#10243A]";
    if (count < 85) return "bg-[#FF9F43]";
    return "bg-[#FF6B2B]";
  };

  return (
    <div className="space-y-6">
      {/* Month Header row */}
      <div className="grid grid-cols-12 text-center text-xs font-bold text-[#4A607A] pb-1">
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
                selectedDay?.date === d.date ? "ring-2 ring-[#FF6B2B] scale-125 z-10" : ""
              }`}
              title={`${d.date}: ${d.count} detections`}
              aria-label={`${d.date}: ${d.count} hotspots`}
            />
          ))}
        </div>
      </div>

      {/* Legend & Selected Day Inspection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E2DEC9] text-xs">
        <div className="flex items-center space-x-2 text-[#4A607A] font-medium">
          <span>Low Activity</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-sm bg-[#EFECE1] border border-[#E2DEC9]" />
            <span className="w-3 h-3 rounded-sm bg-[#10243A]/25" />
            <span className="w-3 h-3 rounded-sm bg-[#10243A]" />
            <span className="w-3 h-3 rounded-sm bg-[#FF9F43]" />
            <span className="w-3 h-3 rounded-sm bg-[#FF6B2B]" />
          </div>
          <span>Peak Burning</span>
        </div>

        {selectedDay ? (
          <div className="flex items-center space-x-3 bg-[#F7F6EF] border border-[#E2DEC9] px-3.5 py-2 rounded-xl text-[#10243A]">
            <CalIcon className="w-4 h-4 text-[#FF6B2B]" />
            <span>
              <strong>{selectedDay.date}:</strong> {selectedDay.count} hotspots
            </span>
            <span className="text-[#E2DEC9]">•</span>
            <span>
              Max FRP: <strong>{selectedDay.maxFrp} MW</strong>
            </span>
            <span className="text-[#E2DEC9]">•</span>
            <span className="text-[#FF6B2B] font-bold">{selectedDay.dominantSensor}</span>
          </div>
        ) : (
          <span className="text-[#4A607A] italic">
            Select any square cell above to inspect daily satellite metrics.
          </span>
        )}
      </div>
    </div>
  );
}
