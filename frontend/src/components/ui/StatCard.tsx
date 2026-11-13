import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: string;
  variant?: "default" | "fire" | "navy" | "orange" | "red" | "green" | "blue";
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  variant = "default",
}: StatCardProps) {
  const isFire = variant === "fire" || variant === "orange" || variant === "red";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7] p-4 sm:p-5 transition-all duration-200 hover:border-[#10243A]/30 hover:shadow-md h-full">
      {/* Subtle top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          isFire ? "bg-[#FF6B2B]" : "bg-[#10243A]"
        }`}
      />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A607A]">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#10243A] truncate">
            {value}
          </div>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
            isFire
              ? "bg-[#FFF2EB] text-[#FF6B2B] border border-[#FF6B2B]/20"
              : "bg-[#10243A]/5 text-[#10243A] border border-[#10243A]/10"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#E2DEC9]/60 pt-2.5 text-xs text-[#4A607A]">
        {subtitle && <span className="truncate">{subtitle}</span>}
        {badge && (
          <span className="ml-auto shrink-0 rounded-md bg-[#10243A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#10243A]">
            {badge}
          </span>
        )}
        {trend && (
          <span className="ml-auto shrink-0 font-bold text-[#FF6B2B]">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
