import { Radio, Sparkles } from "lucide-react";

interface DemoBannerProps {
  isDemo?: boolean;
}

export default function DemoBanner({ isDemo = false }: DemoBannerProps) {
  return (
    <div className="bg-[#10243A] border-b border-white/10 px-4 py-2 text-xs text-[#F7F6EF]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B2B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B2B]"></span>
          </span>
          <span className="text-[#F7F6EF]/90">
            <strong className="font-semibold text-white">NASA FIRMS Telemetry Engine:</strong>{" "}
            {isDemo
              ? "Calibrated demonstration stream active for Bangladesh & South Asia."
              : "Connected to NASA FIRMS (MODIS & VIIRS Near-Real-Time API) with local harmonization cache."}
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-1.5 text-[#FF9F43] text-[11px] font-medium shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span>60/30/10 Minimal Scientific Edition</span>
        </div>
      </div>
    </div>
  );
}
