import {
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  Flame,
  Radio,
  Calendar,
  LockOpen,
  KeyRound,
  Layers,
  Sparkles
} from "lucide-react";
import FirmsSyncButton from "@/components/ui/FirmsSyncButton";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/MotionWrapper";
import {
  getNasaOpenDataPlatforms,
  getFirmsAvailability,
  getNasaEvents
} from "@/lib/api";

const DATA_PRODUCTS = [
  {
    instrument: "MODIS",
    nrtProduct: "MODIS_NRT",
    spProduct: "MODIS_SP",
    satellites: "Terra (AM) & Aqua (PM)",
    resolution: "1 km at nadir (up to 2 km at swath edge)",
    spectrum: "4 µm (Channel 21/22) & 11 µm (Channel 31)",
    latency: "~3 to 4 hours (NRT) / Post-orbit (SP)",
    provider: "NASA ESDIS / LANCE FIRMS",
    archivePeriod: "2000 – Present",
    url: "https://firms.modaps.eosdis.nasa.gov/active_fire/#firms-shapefile",
  },
  {
    instrument: "VIIRS",
    nrtProduct: "VIIRS_SNPP_NRT",
    spProduct: "VIIRS_SNPP_SP",
    satellites: "Suomi-NPP",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours (NRT) / Post-orbit (SP)",
    provider: "NASA ESDIS / LANCE FIRMS",
    archivePeriod: "2012 – Present",
    url: "https://earthdata.nasa.gov/data/instruments/viirs",
  },
  {
    instrument: "VIIRS",
    nrtProduct: "VIIRS_NOAA20_NRT",
    spProduct: "VIIRS_NOAA20_SP",
    satellites: "NOAA-20 (JPSS-1)",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours (NRT) / Post-orbit (SP)",
    provider: "NASA ESDIS / NOAA / LANCE FIRMS",
    archivePeriod: "2018 – Present",
    url: "https://www.nesdis.noaa.gov/current-satellite-missions/currently-flying/joint-polar-satellite-system",
  },
  {
    instrument: "VIIRS",
    nrtProduct: "VIIRS_NOAA21_NRT",
    spProduct: "VIIRS_NOAA21_SP",
    satellites: "NOAA-21 (JPSS-2)",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours (NRT) / Post-orbit (SP)",
    provider: "NASA ESDIS / NOAA / LANCE FIRMS",
    archivePeriod: "2023 – Present",
    url: "https://www.nesdis.noaa.gov/current-satellite-missions/currently-flying/joint-polar-satellite-system",
  },
];

export default async function SourcesPage() {
  const [platforms, availability, eonetEvents] = await Promise.all([
    getNasaOpenDataPlatforms(),
    getFirmsAvailability(),
    getNasaEvents()
  ]);

  return (
    <div className="py-5 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <FadeIn>
      <div className="bg-[#FCFBF7] p-4 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#10243A] text-[#FF6B2B] flex items-center justify-center shrink-0 shadow-sm">
              <Database className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-[#10243A]">
                  NASA Open Data &amp; Provenance
                </h1>
                <span className="hidden sm:inline-flex bg-[#10243A] text-[#F7F6EF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Open Science
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-[#4A607A]">
                Official NASA Earth observation platforms, active-fire telemetry, and open REST endpoints.
              </p>
            </div>
          </div>
          <FirmsSyncButton />
        </div>

        <div className="p-3.5 sm:p-4 bg-[#F7F6EF] rounded-xl border border-[#E2DEC9] text-xs text-[#10243A] leading-relaxed flex items-start gap-2.5 sm:gap-3">
          <ShieldCheck className="w-4 h-4 text-[#FF6B2B] shrink-0 mt-0.5" />
          <p className="min-w-0 flex-1">
            <strong>Official Attribution Statement:</strong> We acknowledge the use of data and imagery from the{" "}
            <strong>Fire Information for Resource Management System (FIRMS)</strong>, part of NASA&apos;s Earth Observing System
            Data and Information System (EOSDIS) operated by the Goddard Space Flight Center, and the{" "}
            <strong>Earth Observatory Natural Event Tracker (EONET v3)</strong>. All NASA data is freely available for public research.
          </p>
        </div>
      </div>
      </FadeIn>

      {/* NASA Open Platforms Directory */}
      <FadeIn delay={0.05} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#10243A] flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#FF6B2B]" />
              Integrated NASA Open Data Platforms
            </h2>
            <p className="text-xs text-[#4A607A]">
              NASA provides completely public data and open APIs without requiring special challenge permissions.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#10243A] bg-[#FCFBF7] border border-[#E2DEC9] px-3 py-1 rounded-lg w-fit">
            {platforms.length} Platforms Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="bg-[#FCFBF7] p-5 rounded-2xl border border-[#E2DEC9] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#10243A]/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF6B2B]">
                      {p.category}
                    </span>
                    <h3 className="font-extrabold text-[#10243A] text-base leading-snug">
                      {p.name}
                    </h3>
                  </div>
                  {p.api_key_required ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#10243A] text-[#F7F6EF] px-2 py-0.5 rounded-full shrink-0">
                      <KeyRound className="w-2.5 h-2.5 text-[#FF6B2B]" />
                      Free Key
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#EAF5EC] text-[#2E7D32] border border-[#2E7D32]/20 px-2 py-0.5 rounded-full shrink-0">
                      <LockOpen className="w-2.5 h-2.5" />
                      100% Open
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#4A607A] leading-relaxed">
                  {p.description}
                </p>

                <div className="pt-2 border-t border-[#E2DEC9] text-xs space-y-1">
                  <span className="font-bold text-[#10243A]">Role in FireDNA:</span>
                  <p className="text-[#10243A]/80 text-[11px] leading-relaxed">
                    {p.role_in_firedna}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#FF6B2B] hover:underline"
                >
                  <span>Explore Platform</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {p.free_registration_url && (
                  <a
                    href={p.free_registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10243A] hover:underline text-[11px]"
                  >
                    Get Free API Key ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* NASA EONET v3 Wildfire Events */}
      <FadeIn delay={0.07}>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2B] animate-pulse" />
              <h2 className="text-lg font-extrabold text-[#10243A]">
                NASA EONET v3 Curated Wildfire Events
              </h2>
            </div>
            <p className="text-xs text-[#4A607A]">
              Macro wildfire incidents verified by NASA Goddard Earth Science Data and Information System (zero API key required).
            </p>
          </div>
          <span className="bg-[#F7F6EF] border border-[#E2DEC9] text-[#10243A] text-xs font-bold px-3 py-1 rounded-xl w-fit">
            {eonetEvents.length} Curated Events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eonetEvents.map((evt) => (
            <div
              key={evt.eonet_id}
              className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#E2DEC9] pb-2.5">
                <div>
                  <h3 className="font-extrabold text-sm text-[#10243A]">
                    {evt.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-[#4A607A] bg-[#FCFBF7] px-1.5 py-0.5 rounded border border-[#E2DEC9]">
                      {evt.eonet_id}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B2B] bg-[#FFF2EB] border border-[#FF6B2B]/20 px-2 py-0.5 rounded-full">
                      {evt.status}
                    </span>
                  </div>
                </div>
                <Flame className="w-5 h-5 text-[#FF6B2B] shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#4A607A]">
                <div>
                  <span className="text-[10px] uppercase font-bold block text-[#10243A]">Location</span>
                  <span>
                    {evt.latitude != null && evt.longitude != null
                      ? `${evt.latitude.toFixed(3)}°N, ${evt.longitude.toFixed(3)}°E`
                      : "Regional"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-[#10243A]">Burn Extent</span>
                  <span>
                    {evt.magnitude_value != null ? `${evt.magnitude_value} ${evt.magnitude_unit || ""}` : "Satellite Monitored"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-[#10243A]">First Observed</span>
                  <span>
                    {evt.first_observed ? new Date(evt.first_observed).toLocaleDateString() : "Active"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-[#10243A]">Data Provider</span>
                  <span className="font-semibold text-[#10243A]">{evt.data_source || "NASA EONET v3"}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs">
                <a
                  href={evt.eonet_link || `https://eonet.gsfc.nasa.gov/api/v3/events/${evt.eonet_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-[#FF6B2B] font-bold hover:underline"
                >
                  <span>View in NASA EONET v3</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      </FadeIn>

      {/* Satellite Product Specifications & Availability */}
      <FadeIn delay={0.08}>
      <div className="bg-[#FCFBF7] p-5 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#FF6B2B]" />
            <h2 className="text-xl font-extrabold text-[#10243A]">
              NASA FIRMS Active-Fire Telemetry: NRT vs. SP Archive
            </h2>
          </div>
          <p className="text-xs text-[#4A607A] mt-1">
            FireDNA integrates both Near-Real-Time (NRT) products for rapid alerting and Standard Processing (SP) historical archive data.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_PRODUCTS.map((prod) => (
            <div
              key={prod.nrtProduct}
              className="p-5 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-[#E2DEC9] pb-2.5">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      prod.instrument === "MODIS" ? "bg-[#E85D5D]" : "bg-[#FF6B2B]"
                    }`}
                  />
                  <h3 className="font-extrabold text-base text-[#10243A] font-mono">
                    {prod.nrtProduct}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#10243A] text-[#F7F6EF] px-2 py-0.5 rounded-md">
                    {prod.instrument}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E2DEC9] text-[#10243A] px-2 py-0.5 rounded-md">
                    {prod.spProduct}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#4A607A] space-y-1.5">
                <div className="flex justify-between">
                  <span>Satellites:</span>
                  <strong className="text-[#10243A]">{prod.satellites}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pixel Resolution:</span>
                  <strong className="text-[#10243A]">{prod.resolution}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Detection Channels:</span>
                  <strong className="text-[#10243A]">{prod.spectrum}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Data Latency:</span>
                  <strong className="text-[#10243A]">{prod.latency}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Mission Record:</span>
                  <strong className="text-[#10243A]">{prod.archivePeriod}</strong>
                </div>
              </div>

              <a
                href={prod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-[#FF6B2B] hover:underline pt-1 font-bold"
              >
                <span>View NASA EOSDIS Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* Data Availability Table */}
        <div className="mt-6 pt-5 border-t border-[#E2DEC9] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#10243A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B2B]" />
              FIRMS Product Date Coverage &amp; Windows
            </h3>
            <span className="text-[11px] text-[#4A607A]">
              Automatic Multi-Chunk Date Fetching Enabled
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E2DEC9]">
            <table className="w-full min-w-[580px] text-left text-xs">
              <thead className="bg-[#10243A] text-[#F7F6EF]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Data Product ID</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Coverage Window (Min → Max)</th>
                  <th className="py-2.5 px-3 font-bold">Ingestion Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DEC9] bg-[#FCFBF7]">
                {availability.map((av) => {
                  const isNrt = av.data_id.includes("NRT");
                  return (
                    <tr key={av.data_id} className="hover:bg-[#F7F6EF] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#10243A]">
                        {av.data_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isNrt
                              ? "bg-[#FFF2EB] text-[#FF6B2B] border border-[#FF6B2B]/20"
                              : "bg-[#10243A]/10 text-[#10243A]"
                          }`}
                        >
                          {isNrt ? "Near-Real-Time" : "Standard Archive"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#4A607A] font-medium">
                        {av.min_date} &rarr; {av.max_date}
                      </td>
                      <td className="py-2.5 px-3 text-[#10243A]">
                        {isNrt
                          ? "Last 10 days rolling sync"
                          : "Chunked batch historical calibration"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* Scientific Integrity & Sensor Caveats */}
      <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-2xl border border-[#E2DEC9] shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-[#10243A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF6B2B]" />
          Scientific Transparency &amp; Sensor Calibration Caveats
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#4A607A] leading-relaxed">
          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <strong className="text-[#10243A] block font-extrabold">
              1. Spatial Resolution Disparity
            </strong>
            <p>
              VIIRS operates at 375 m pixel size, while MODIS operates at 1000 m (1 km). A single fire can register as 1 MODIS detection but up to 6–7 VIIRS detections. Raw counts cannot be directly compared without 0.1° harmonization.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <strong className="text-[#10243A] block font-extrabold">
              2. Atmospheric &amp; Cloud Obscuration
            </strong>
            <p>
              Middle-infrared (MIR) thermal signals cannot penetrate dense monsoon cloud layers or thick convective storm systems. Non-detection during cloud-covered periods does not guarantee absence of fire on the surface.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] space-y-2">
            <strong className="text-[#10243A] block font-extrabold">
              3. Polar-Orbiting Overpass Timing
            </strong>
            <p>
              Terra, Aqua, Suomi-NPP, and NOAA-20/21 fly in sun-synchronous polar orbits, crossing the equator at specific local solar times. Ephemeral fires ignited and extinguished between overpass windows are unrecorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
