"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, Tooltip, CartesianGrid
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
    HAI: (haiScores[i] || 0) * 100,
    rawHai: haiScores[i] || 0,
  }));

  return (
    <div className="w-full h-64 sm:h-80 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 10, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#4A607A"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => String(v).slice(5)}
          />
          <YAxis stroke="#4A607A" fontSize={11} width={40} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-[#FCFBF7] p-3.5 rounded-xl border border-[#E2DEC9] shadow-md text-xs space-y-1">
                    <p className="font-extrabold text-[#10243A] border-b border-[#E2DEC9] pb-1 mb-1">{label}</p>
                    <p className="text-[#E85D5D] font-medium">MODIS (~1 km): <strong>{item.MODIS}</strong></p>
                    <p className="text-[#FF6B2B] font-medium">VIIRS (375 m): <strong>{item.VIIRS}</strong></p>
                    <p className="text-[#10243A] font-bold">Harmonized HAI: {item.rawHai.toFixed(3)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="MODIS" fill="#E85D5D" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="VIIRS" fill="#FF6B2B" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            type="monotone"
            dataKey="HAI"
            stroke="#10243A"
            strokeWidth={3}
            dot={{ r: 4, fill: "#10243A" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
