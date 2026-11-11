import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DemoBanner from "@/components/ui/DemoBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FireDNA — Understand Fire. Connect Data. Protect Our Planet.",
  description: "NASA Space Apps Challenge 2026: Multi-Satellite MODIS and VIIRS Active Fire Harmonization, Analytics, and Educational Geospatial Dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#10243A]">
        <DemoBanner isDemo={true} />
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

