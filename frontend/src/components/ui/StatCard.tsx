import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: string;
  color?: "orange" | "green" | "blue" | "red" | "navy";
}

const COLOR_MAP = {
  orange: {
    bg: "bg-orange-50",
    border: "border-[#FF9F43]/30",
    iconBg: "bg-[#FF9F43]/15 text-[#FF9F43]",
  },
  green: {
    bg: "bg-emerald-50",
    border: "border-[#2D8A64]/30",
    iconBg: "bg-[#2D8A64]/15 text-[#2D8A64]",
  },
  blue: {
    bg: "bg-sky-50",
    border: "border-[#67B7E1]/30",
    iconBg: "bg-[#67B7E1]/15 text-[#67B7E1]",
  },
  red: {
    bg: "bg-red-50",
    border: "border-[#E85D5D]/30",
    iconBg: "bg-[#E85D5D]/15 text-[#E85D5D]",
  },
  navy: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    iconBg: "bg-[#10243A]/10 text-[#10243A]",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  color = "orange",
}: StatCardProps) {
  const c = COLOR_MAP[color] || COLOR_MAP.orange;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm ${c.border} transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="text-3xl font-extrabold text-[#10243A] tracking-tight">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none ${c.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        {subtitle && <span>{subtitle}</span>}
        {badge && (
          <span className="ml-auto font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {trend && (
          <span className="ml-auto font-semibold text-[#2D8A64]">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
