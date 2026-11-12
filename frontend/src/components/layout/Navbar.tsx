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
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Anomalies", href: "/anomalies", icon: AlertTriangle },
  { label: "Sources", href: "/sources", icon: Database },
  { label: "About", href: "/about", icon: Info },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isActiveRoute(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2DEC9] bg-[#F7F6EF]/90 text-[#10243A] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-none"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10243A] text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Flame className="h-5 w-5 text-[#FF6B2B]" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-[#10243A]">
                  Fire<span className="text-[#FF6B2B]">DNA</span>
                </span>
                <span className="rounded-md bg-[#10243A]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10243A]">
                  NASA 2026
                </span>
              </div>
              <span className="hidden text-[10px] font-medium text-[#4A607A] sm:block">
                Understand Fire · Connect Data
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#10243A] text-[#F7F6EF] shadow-sm"
                      : "text-[#10243A]/75 hover:bg-[#10243A]/5 hover:text-[#10243A]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-[#FF6B2B]" : "text-[#10243A]/60"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Region Pill & Mobile Menu Button */}
          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-[#E2DEC9] bg-[#FCFBF7] px-3 py-1.5 text-xs font-medium text-[#10243A] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#FF6B2B]" />
              <span>Bangladesh &amp; S. Asia</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2DEC9] bg-[#FCFBF7] text-[#10243A] hover:bg-[#10243A] hover:text-white xl:hidden transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav className="border-t border-[#E2DEC9] bg-[#FCFBF7] px-4 py-4 shadow-lg xl:hidden">
          <div className="grid grid-cols-2 gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-[#10243A] bg-[#10243A] text-white"
                      : "border-[#E2DEC9] bg-[#F7F6EF]/60 text-[#10243A] hover:border-[#10243A]/30"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#FF6B2B]" : "text-[#10243A]/70"}`} />
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
