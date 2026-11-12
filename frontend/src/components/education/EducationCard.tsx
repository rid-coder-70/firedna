"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Flame } from "lucide-react";

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
    <div className="group rounded-2xl border border-[#E2DEC9] bg-[#FCFBF7] p-5 transition-all duration-200 hover:border-[#10243A]/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10243A] text-white">
            <BookOpen className="h-3.5 w-3.5 text-[#FF6B2B]" />
          </div>
          <span className="rounded-md bg-[#EFECE1] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#10243A]">
            {tag}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg border border-[#E2DEC9] bg-[#F7F6EF] p-1 text-[#10243A] transition-colors hover:bg-[#10243A] hover:text-white"
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

      <p className="mt-1.5 text-sm leading-relaxed text-[#4A607A]">
        {shortAnswer}
      </p>

      <div
        id={detailsId}
        hidden={!expanded}
        className="mt-3.5 space-y-2 rounded-xl border border-[#E2DEC9] bg-[#F7F6EF] p-3.5 text-xs leading-relaxed text-[#10243A]"
      >
        <p>{detailedAnswer}</p>
        <div className="flex items-center space-x-1.5 pt-1 text-[11px] font-semibold text-[#FF6B2B]">
          <Flame className="h-3.5 w-3.5" />
          <span>FireDNA Educational Reference</span>
        </div>
      </div>
    </div>
  );
}
