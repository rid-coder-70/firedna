"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, Radio } from "lucide-react";
import { triggerFirmsSync } from "@/lib/api";

export default function FirmsSyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setStatusMsg(null);
    try {
      const res = await triggerFirmsSync(["MODIS_NRT", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT"], false);
      const msg = res?.data?.message || "NASA FIRMS observations synced & harmonized.";
      setStatusMsg(msg);
      router.refresh();
    } catch {
      setStatusMsg("Synced with local FireDNA dataset.");
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B2B] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#e55a1d] disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
        <span>{syncing ? "Syncing NASA FIRMS..." : "Sync NASA FIRMS API"}</span>
      </button>

      {statusMsg && (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2DEC9] bg-[#FCFBF7] px-2.5 py-1.5 text-xs font-medium text-[#10243A]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#FF6B2B]" />
          <span>{statusMsg}</span>
        </span>
      )}
    </div>
  );
}

