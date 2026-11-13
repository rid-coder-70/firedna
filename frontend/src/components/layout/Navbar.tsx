"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    <header className="sticky top-0 z-50 border-b border-[#E2DEC9] bg-[#F7F6EF]/95 text-[#10243A] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 focus-visible:outline-none"
          >
            <motion.span
              whileHover={{ scale: 1.06, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 360, damping: 22 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10243A] text-white shadow-sm"
            >
              <Flame className="h-5 w-5 text-[#FF6B2B]" />
            </motion.span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#10243A]">
                  Fire<span className="text-[#FF6B2B]">DNA</span>
                </span>
                <span className="rounded-md bg-[#10243A]/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#10243A]">
                  NASA 2026
                </span>
              </div>
              <span className="hidden text-[10px] font-medium text-[#4A607A] xl:block">
                Understand Fire · Connect Data
              </span>
            </div>
          </Link>

          {/* Laptop & Desktop Navigation (Visible from lg: 1024px upwards) */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-0.5 lg:flex xl:gap-1"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors duration-150 xl:px-3 ${
                    isActive
                      ? "text-[#F7F6EF]"
                      : "text-[#10243A]/75 hover:bg-[#10243A]/5 hover:text-[#10243A]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 -z-10 rounded-xl bg-[#10243A] shadow-sm"
                    />
                  )}
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

          {/* Region Pill & Phone/Tablet Burger Menu Button */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-[#E2DEC9] bg-[#FCFBF7] px-2.5 py-1.5 text-[11px] font-medium text-[#10243A] sm:flex xl:px-3 xl:text-xs">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6B2B]" />
              <span className="whitespace-nowrap">South Asia</span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setMobileOpen((open) => !open)}
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors lg:hidden ${
                mobileOpen
                  ? "border-[#10243A] bg-[#10243A] text-[#F7F6EF]"
                  : "border-[#E2DEC9] bg-[#FCFBF7] text-[#10243A] hover:border-[#10243A]"
              }`}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-burger-drawer"
            >
              {mobileOpen ? <X className="h-4 w-4 text-[#FF6B2B]" /> : <Menu className="h-4 w-4" />}
              <span className="sm:hidden">{mobileOpen ? "Close" : "Menu"}</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Smooth Animated Phone & Tablet Burger Drawer (< 1024px) */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.nav
            id="mobile-burger-drawer"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#E2DEC9] bg-[#FCFBF7] shadow-lg lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-3 px-4 py-4">
              <div className="flex items-center justify-between rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] px-3.5 py-2.5 text-xs font-medium text-[#10243A] sm:hidden">
                <span>Monitoring Region</span>
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B2B]" />
                  South Asia
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                {NAV_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors ${
                          isActive
                            ? "border-[#10243A] bg-[#10243A] text-white shadow-sm"
                            : "border-[#E2DEC9] bg-[#F7F6EF]/75 text-[#10243A] hover:border-[#10243A]/35"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-[#FF6B2B]" : "text-[#10243A]/70"
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-[#FF6B2B]" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
