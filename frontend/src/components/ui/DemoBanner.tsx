import { AlertCircle, Info } from "lucide-react";

interface DemoBannerProps {
  isDemo?: boolean;
}

export default function DemoBanner({ isDemo = true }: DemoBannerProps) {
  if (!isDemo) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Scientific Demonstration Mode:</strong> Displaying synthetic observations for Bangladesh & South Asia 
            calibrated to match official NASA FIRMS statistical distributions.
          </span>
        </div>
        <div className="hidden sm:flex items-center space-x-1.5 text-amber-700 text-[11px] font-medium flex-shrink-0">
          <Info className="w-3.5 h-3.5" />
          <span>NASA FIRMS API Key not configured</span>
        </div>
      </div>
    </div>
  );
}

