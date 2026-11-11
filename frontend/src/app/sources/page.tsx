import { Database, ExternalLink, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

const DATA_PRODUCTS = [
  {
    instrument: "MODIS",
    product: "MODIS_NRT",
    satellites: "Terra (AM) & Aqua (PM)",
    resolution: "1 km at nadir (up to 2 km at swath edge)",
    spectrum: "4 µm (Channel 21/22) & 11 µm (Channel 31)",
    latency: "~3 to 4 hours after satellite overpass",
    provider: "NASA ESDIS / LANCE FIRMS",
    archivePeriod: "2000 – Present",
    url: "https://firms.modaps.eosdis.nasa.gov/active_fire/#firms-shapefile"
  },
  {
    instrument: "VIIRS",
    product: "VIIRS_SNPP_NRT",
    satellites: "Suomi-NPP",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours after satellite overpass",
    provider: "NASA ESDIS / LANCE FIRMS",
    archivePeriod: "2012 – Present",
    url: "https://earthdata.nasa.gov/data/instruments/viirs"
  },
  {
    instrument: "VIIRS",
    product: "VIIRS_NOAA20_NRT",
    satellites: "NOAA-20 (JPSS-1)",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours after satellite overpass",
    provider: "NASA ESDIS / NOAA / LANCE FIRMS",
    archivePeriod: "2018 – Present",
    url: "https://www.nesdis.noaa.gov/current-satellite-missions/currently-flying/joint-polar-satellite-system"
  },
  {
    instrument: "VIIRS",
    product: "VIIRS_NOAA21_NRT",
    satellites: "NOAA-21 (JPSS-2)",
    resolution: "375 m constant swath resolution",
    spectrum: "3.74 µm (I-4) & 11.45 µm (I-5)",
    latency: "~3 hours after satellite overpass",
    provider: "NASA ESDIS / NOAA / LANCE FIRMS",
    archivePeriod: "2023 – Present",
    url: "https://www.nesdis.noaa.gov/current-satellite-missions/currently-flying/joint-polar-satellite-system"
  }
];

export default function SourcesPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#10243A] flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#10243A]">Data Sources & Scientific Provenance</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Official NASA satellite products, data attribution, calibration notes, and architectural transparency.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed flex items-start space-x-3">
          <ShieldCheck className="w-4 h-4 text-[#2D8A64] flex-shrink-0 mt-0.5" />
          <p>
            <strong>Official Attribution Statement:</strong> We acknowledge the use of data and imagery from the 
            <strong> Fire Information for Resource Management System (FIRMS)</strong>, part of NASA&apos;s Earth Observing System 
            Data and Information System (EOSDIS), operated by the Goddard Space Flight Center.
          </p>
        </div>
      </div>

      {/* Satellite Product Specifications Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#10243A]">NASA FIRMS Near-Real-Time (NRT) Products</h2>
          <p className="text-xs text-slate-500">Specifications of active-fire instruments integrated into FireDNA</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_PRODUCTS.map((prod) => (
            <div key={prod.product} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${prod.instrument === 'MODIS' ? 'bg-[#E85D5D]' : 'bg-[#FF9F43]'}`} />
                  <h3 className="font-bold text-base text-[#10243A]">{prod.product}</h3>
                </div>
                <span className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                  {prod.instrument}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                <div className="flex justify-between"><span className="text-slate-400">Platform:</span> <strong className="text-slate-800">{prod.satellites}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Resolution:</span> <strong className="text-slate-800">{prod.resolution}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Detection Bands:</span> <strong className="text-slate-800">{prod.spectrum}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Data Latency:</span> <strong className="text-slate-800">{prod.latency}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">Archive Record:</span> <strong className="text-slate-800">{prod.archivePeriod}</strong></div>
              </div>

              <a
                href={prod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-[#67B7E1] hover:underline pt-2 font-medium"
              >
                <span>View NASA EOSDIS Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Demonstration Data & Limitations Statement */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[#10243A]">Known Scientific Limitations</h2>
        
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2D8A64] flex-shrink-0 mt-0.5" />
            <p><strong>Cloud Obscuration:</strong> Thick clouds completely obstruct satellite middle-infrared fire views. Fire counts during monsoons underestimate true ground activity.</p>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2D8A64] flex-shrink-0 mt-0.5" />
            <p><strong>Overpass Timing:</strong> Polar-orbiting satellites visit mid-latitudes 1–2 times per 24 hours. Fires that start and extinguish between satellite passes are not recorded.</p>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2D8A64] flex-shrink-0 mt-0.5" />
            <p><strong>Fire Cause Identification:</strong> Satellite hotspots represent thermal infrared radiation. They do not distinguish between crop stubble clearing, prescribed burns, or wild forest fires.</p>
          </div>
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2D8A64] flex-shrink-0 mt-0.5" />
            <p><strong>Experimental Harmonized Activity Index:</strong> HAI is FireDNA&apos;s prototype composite score for educational comparison. It is not an official NASA-validated index.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

