"use client";

import { useState } from "react";
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

  return (
    <div className="rounded-2xl bg-white border border-[#67B7E1]/30 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#67B7E1]/15 text-[#10243A] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-[#2D8A64]" />
          </div>
          <span className="text-xs font-semibold text-[#2D8A64] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          aria-label={expanded ? "Collapse explanation" : "Expand explanation"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <h3 className="mt-3 text-base font-bold text-[#10243A]">
        {question}
      </h3>

      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
        {shortAnswer}
      </p>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2 bg-slate-50/70 p-3 rounded-xl">
          <p>{detailedAnswer}</p>
          <div className="flex items-center space-x-1.5 text-[11px] text-[#2D8A64] font-medium pt-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Designed for student learners and scientific enthusiasts</span>
          </div>
        </div>
      )}
    </div>
  );
}

