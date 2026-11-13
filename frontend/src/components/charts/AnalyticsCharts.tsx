"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import { DailyAnalytics, MonthlyAnalytics, SeasonalAnalytics } from "@/lib/types";

interface AnalyticsChartsProps {
  dailyData: DailyAnalytics[];
  monthlyData: MonthlyAnalytics[];
  seasonalData: SeasonalAnalytics[];
}

export default function AnalyticsCharts({
  dailyData,
  monthlyData,
  seasonalData,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Chart 1: Daily Time Series */}
      <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#10243A]">
            Daily Hotspot Detection Trend
          </h2>
          <p className="text-xs text-[#4A607A]">
            Comparing daily observation volumes from MODIS (~1 km) and VIIRS (375 m)
          </p>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 8, bottom: 10, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#4A607A"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => String(v).slice(5)}
              />
              <YAxis stroke="#4A607A" fontSize={11} width={44} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyAnalytics;
                    return (
                      <div className="bg-[#FCFBF7] p-3.5 rounded-xl border border-[#E2DEC9] shadow-md text-xs space-y-1">
                        <p className="font-bold text-[#10243A] border-b border-[#E2DEC9] pb-1">{label}</p>
                        <p className="text-[#E85D5D]">MODIS: <strong>{d.modis_count.toLocaleString()}</strong></p>
                        <p className="text-[#FF6B2B]">VIIRS: <strong>{d.viirs_count.toLocaleString()}</strong></p>
                        <p className="font-bold text-[#10243A]">Combined: {d.total_count.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="modis_count" name="MODIS (~1 km)" stroke="#E85D5D" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="viirs_count" name="VIIRS (375 m)" stroke="#FF6B2B" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="total_count" name="Total Combined" stroke="#10243A" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Two Charts: Monthly Climatology & Seasonal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Monthly Climatology */}
        <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#10243A]">
              Monthly Climatological Profile
            </h2>
            <p className="text-xs text-[#4A607A]">
              Historical monthly burning distribution (Jan–Dec)
            </p>
          </div>

          <div className="w-full h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 8, bottom: 10, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
                <XAxis dataKey="month_name" stroke="#4A607A" fontSize={10} tickLine={false} />
                <YAxis stroke="#4A607A" fontSize={10} width={44} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as MonthlyAnalytics;
                      return (
                        <div className="bg-[#FCFBF7] p-3 rounded-xl border border-[#E2DEC9] shadow-md text-xs space-y-1">
                          <p className="font-bold text-[#10243A]">{label}</p>
                          <p className="text-[#FF6B2B] font-semibold">Hotspots: {d.total_count.toLocaleString()}</p>
                          <p className="text-[#4A607A]">Mean FRP: {d.mean_frp != null ? `${Number(d.mean_frp).toFixed(1)} MW` : "N/A"}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total_count" fill="#FF6B2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Breakdown */}
        <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#10243A]">
              Seasonal Burning Breakdown
            </h2>
            <p className="text-xs text-[#4A607A]">
              Pre-Monsoon (MAM) vs Monsoon (JJA) vs Harvest (SON) vs Winter (DJF)
            </p>
          </div>

          <div className="w-full h-60 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalData} margin={{ top: 10, right: 8, bottom: 10, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DEC9" vertical={false} />
                <XAxis dataKey="season" stroke="#4A607A" fontSize={11} tickLine={false} />
                <YAxis stroke="#4A607A" fontSize={11} width={44} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as SeasonalAnalytics;
                      return (
                        <div className="bg-[#FCFBF7] p-3 rounded-xl border border-[#E2DEC9] shadow-md text-xs space-y-1">
                          <p className="font-bold text-[#10243A]">{d.name} ({label})</p>
                          <p className="text-[#10243A] font-semibold">Mean Daily: {Number(d.mean_daily_count).toLocaleString()}</p>
                          <p className="text-[#FF6B2B]">Total Seasonal: {d.total_count.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mean_daily_count" fill="#10243A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
