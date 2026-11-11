"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame, Map, SplitSquareVertical, Calendar,
  BarChart2, AlertTriangle, Database, Info, Menu, X
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: Flame },
  { label: "Fire Map", href: "/map", icon: Map },
  { label: "Sensor Lab", href: "/compare", icon: SplitSquareVertical },
  { label: "Fire Calendar", href: "/calendar", icon: Calendar },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { label: "Data Sources", href: "/sources", icon: Database },
  { label: "About", href: "/about", icon: Info },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#10243A] text-white shadow-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E85D5D] to-[#FF9F43] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xl tracking-tight text-white">Fire<span className="text-[#FF9F43]">DNA</span></span>
                <span className="text-[10px] font-semibold bg-[#2D8A64]/80 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">NASA 2026</span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">Understand Fire • Connect Data</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#2D8A64] text-white shadow-sm"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Demonstration Area Pill */}
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#FF9F43] animate-pulse"></span>
            <span>Focus: Bangladesh & S. Asia</span>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0B1928] border-b border-slate-700 px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-[#2D8A64] text-white"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5 text-[#FF9F43]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

