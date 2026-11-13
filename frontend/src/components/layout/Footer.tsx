import Link from "next/link";
import { Flame, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#10243A] text-[#F7F6EF] border-t border-[#10243A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B2B] flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-[#F7F6EF]">
                Fire<span className="text-[#FF6B2B]">DNA</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#F7F6EF]/75 leading-relaxed max-w-md">
              A scientific environmental data platform developed for the <strong>NASA Space Apps Challenge 2026</strong>.
              FireDNA bridges MODIS (~1 km) and VIIRS (375 m) active-fire observations through spatial and temporal harmonization.
            </p>
            <p className="text-xs text-[#F7F6EF]/50">
              Primary demonstration region: <strong>South Asia (5°N–40°N, 54°E–102°E)</strong> • Built for global coordinates.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold text-[#FF9F43] uppercase tracking-wider mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-[#F7F6EF]/80">
              <li><Link href="/" className="hover:text-[#FF6B2B] transition-colors">Overview Dashboard</Link></li>
              <li><Link href="/map" className="hover:text-[#FF6B2B] transition-colors">Interactive Fire Map</Link></li>
              <li><Link href="/compare" className="hover:text-[#FF6B2B] transition-colors">Sensor Comparison Lab</Link></li>
              <li><Link href="/calendar" className="hover:text-[#FF6B2B] transition-colors">Fire Activity Calendar</Link></li>
              <li><Link href="/analytics" className="hover:text-[#FF6B2B] transition-colors">Historical Analytics</Link></li>
              <li><Link href="/anomalies" className="hover:text-[#FF6B2B] transition-colors">Anomaly Z-Score Explorer</Link></li>
            </ul>
          </div>

          {/* Attribution */}
          <div>
            <h4 className="text-xs font-bold text-[#FF9F43] uppercase tracking-wider mb-3">
              Scientific Provenance
            </h4>
            <p className="text-xs text-[#F7F6EF]/75 leading-relaxed mb-3">
              Active-fire observations sourced from <strong>NASA FIRMS</strong> (Fire Information for Resource Management System).
            </p>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#FF6B2B] hover:underline"
            >
              <span>NASA FIRMS Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-[#F7F6EF]/50">
              HAI index and Z-scores are experimental FireDNA research metrics.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-[#F7F6EF]/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 FireDNA • NASA Space Apps Challenge</p>
          <p>Understand Fire · Connect Data · Protect Our Planet</p>
        </div>
      </div>
    </footer>
  );
}
