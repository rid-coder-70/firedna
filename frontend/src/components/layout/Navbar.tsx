"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  function isActiveRoute(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10243A]/95 text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43] focus-visible:ring-offset-4 focus-visible:ring-offset-[#10243A]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF9F43] to-[#E85D5D] shadow-lg shadow-orange-950/25 transition duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transition-none">
              <Flame className="h-6 w-6 text-white" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Fire<span className="text-[#FF9F43]">DNA</span>
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                  NASA 2026
                </span>
              </span>
              <span className="hidden text-[11px] text-slate-300 sm:block">
                Understand Fire · Connect Data
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 sm:flex">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF9F43]" />
              <span>Bangladesh &amp; South Asia</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-200 transition duration-200 hover:border-[#FF9F43]/50 hover:bg-[#FF9F43]/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43] xl:hidden motion-reduce:transition-none"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav aria-label="Main navigation" className="hidden items-center justify-between gap-1 border-t border-white/[0.08] py-2 xl:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43] motion-reduce:transition-none ${
                  isActive
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "text-slate-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isActive ? "text-emerald-300" : "text-slate-400 group-hover:scale-110 group-hover:text-[#FF9F43]"}`} />
                <span>{item.label}</span>
                {isActive && <span className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-gradient-to-r from-[#2D8A64] to-[#67B7E1]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-[#0B1928] px-4 pb-5 pt-3 shadow-xl xl:hidden sm:px-6"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F43] motion-reduce:transition-none ${
                    isActive
                      ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-100"
                      : "border-white/[0.06] text-slate-300 hover:border-[#FF9F43]/30 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-emerald-300" : "text-[#FF9F43]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
