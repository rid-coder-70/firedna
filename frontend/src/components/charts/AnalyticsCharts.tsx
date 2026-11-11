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
    <div className="space-y-8">
      
      {/* Chart 1: Daily Time Series */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#10243A]">Daily Hotspot Detection Trend</h2>
          <p className="text-xs text-slate-500">Comparing daily observation volumes from MODIS (1 km) and VIIRS (375 m)</p>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailyAnalytics;
                    return (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                        <p className="font-bold text-[#10243A]">{label}</p>
                        <p className="text-[#E85D5D]">MODIS: {d.modis_count}</p>
                        <p className="text-[#FF9F43]">VIIRS: {d.viirs_count}</p>
                        <p className="font-semibold text-slate-800">Total: {d.total_count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="modis_count" name="MODIS (1 km)" stroke="#E85D5D" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="viirs_count" name="VIIRS (375 m)" stroke="#FF9F43" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="total_count" name="Combined Detections" stroke="#10243A" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Two Charts: Monthly Climatology & Seasonal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Climatology */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#10243A]">Monthly Climatological Profile</h2>
            <p className="text-xs text-slate-500">Historical monthly burning distribution across months (Jan–Dec)</p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month_name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as MonthlyAnalytics;
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                          <p className="font-bold text-[#10243A]">{label}</p>
                          <p className="text-[#FF9F43]">Total Hotspots: {d.total_count}</p>
                          <p className="text-slate-500">Mean FRP: {d.mean_frp} MW</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total_count" fill="#FF9F43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Breakdown */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#10243A]">Seasonal Burning Breakdown</h2>
            <p className="text-xs text-slate-500">Pre-Monsoon (MAM) vs Monsoon (JJA) vs Harvest (SON) vs Dry (DJF)</p>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalData} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="season" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as SeasonalAnalytics;
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                          <p className="font-bold text-[#10243A]">{d.name} ({label})</p>
                          <p className="text-[#2D8A64]">Mean Daily Hotspots: {d.mean_daily_count}</p>
                          <p className="text-slate-500">Total Seasonal Hotspots: {d.total_count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mean_daily_count" fill="#2D8A64" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

