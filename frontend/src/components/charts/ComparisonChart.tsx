"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";

interface ComparisonChartProps {
  dates: string[];
  modisCounts: number[];
  viirsCounts: number[];
  haiScores: number[];
}

export default function ComparisonChart({
  dates,
  modisCounts,
  viirsCounts,
  haiScores,
}: ComparisonChartProps) {
  const data = dates.map((d, i) => ({
    date: d,
    MODIS: modisCounts[i] || 0,
    VIIRS: viirsCounts[i] || 0,
    HAI: (haiScores[i] || 0) * 100, // scaled 0-100 for visual parity with count axis
    rawHai: haiScores[i] || 0,
  }));

  return (
    <div className="w-full h-80 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                    <p className="font-bold text-[#10243A]">{label}</p>
                    <p className="text-[#E85D5D]">MODIS Detections: {item.MODIS}</p>
                    <p className="text-[#FF9F43]">VIIRS Detections: {item.VIIRS}</p>
                    <p className="text-[#2D8A64] font-semibold">Harmonized HAI: {item.rawHai.toFixed(3)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="MODIS" fill="#E85D5D" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="VIIRS" fill="#FF9F43" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Line type="monotone" dataKey="HAI" stroke="#2D8A64" strokeWidth={3} dot={{ r: 4, fill: "#2D8A64" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

