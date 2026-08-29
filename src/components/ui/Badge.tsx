import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "active" | "inactive" | "warning" | "maroon";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
  active: "border-[#7A1F2B]/20 bg-[#7A1F2B]/5 text-[#7A1F2B]",
  inactive: "border-neutral-300 bg-neutral-100 text-neutral-600",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  maroon: "border-[#7A1F2B]/20 bg-[#7A1F2B]/5 text-[#7A1F2B]",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
