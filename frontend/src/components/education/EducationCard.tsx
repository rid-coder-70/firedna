"use client";

import { useId, useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface EducationCardProps {
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  tag?: string;
  defaultExpanded?: boolean;
}

export default function EducationCard({
  question,
  shortAnswer,
  detailedAnswer,
  tag = "Satellite Science",
  defaultExpanded = false,
}: EducationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailsId = useId();

  return (
    <div className="group rounded-2xl border border-[#67B7E1]/30 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#67B7E1]/60 hover:shadow-lg hover:shadow-sky-950/5 motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#67B7E1]/15 text-[#10243A] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
            <BookOpen className="h-4 w-4 text-[#2D8A64]" />
          </div>
          <span className="text-xs font-semibold text-[#2D8A64] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67B7E1] focus-visible:ring-offset-2"
          aria-label={expanded ? "Collapse explanation" : "Expand explanation"}
          aria-expanded={expanded}
          aria-controls={detailsId}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <h3 className="mt-3 text-base font-bold text-[#10243A]">
        {question}
      </h3>

      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
        {shortAnswer}
      </p>

      <div id={detailsId} hidden={!expanded} className="mt-3 space-y-2 rounded-xl border-t border-slate-100 bg-slate-50/70 p-3 pt-3 text-xs leading-relaxed text-slate-700">
        <p>{detailedAnswer}</p>
        <div className="flex items-center space-x-1.5 text-[11px] text-[#2D8A64] font-medium pt-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Designed for student learners and scientific enthusiasts</span>
        </div>
      </div>
    </div>
  );
}
