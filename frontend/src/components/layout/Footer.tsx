import Link from "next/link";
import { Flame, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#10243A] text-slate-300 border-t border-slate-700/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#E85D5D] to-[#FF9F43] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Fire<span className="text-[#FF9F43]">DNA</span></span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              A scientific environmental data platform developed for the <strong>NASA Space Apps Challenge 2026</strong>. 
              FireDNA bridges the gap between MODIS and VIIRS satellite observations through transparent spatial and temporal harmonization.
            </p>
            <p className="text-xs text-slate-400">
              Primary demonstration area: <strong>Bangladesh and South Asia</strong>. Architecture designed for global scalability.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home Dashboard</Link></li>
              <li><Link href="/map" className="hover:text-white transition-colors">Interactive Fire Map</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Sensor Comparison Lab</Link></li>
              <li><Link href="/calendar" className="hover:text-white transition-colors">Fire Activity Calendar</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Historical Analytics</Link></li>
              <li><Link href="/anomalies" className="hover:text-white transition-colors">Anomaly Explorer</Link></li>
            </ul>
          </div>

          {/* Data Attribution & Disclaimers */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Scientific Attribution</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Hotspot data provided by <strong>NASA FIRMS</strong> (Fire Information for Resource Management System).
            </p>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-[#67B7E1] hover:underline"
            >
              <span>NASA FIRMS Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
              Prototype HAI index and Z-scores are experimental metrics developed by FireDNA.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 FireDNA Team • Built for NASA Space Apps Challenge</p>
          <p className="flex items-center space-x-1">
            <span>Crafted for Earth & Space Science</span>
            <Heart className="w-3.5 h-3.5 text-[#E85D5D] fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}

