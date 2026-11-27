import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  illustration?: "trend" | "workout" | "nutrition" | "recovery";
  className?: string;
}

const EmptyIllustration: React.FC<{ kind: NonNullable<EmptyStateProps["illustration"]> }> = ({
  kind,
}) => {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-16 text-slate-500 shrink-0"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="32" rx="6" className="stroke-white/[0.08]" />
      {kind === "trend" && (
        <path d="M10 26 L22 20 L34 22 L46 13 L54 15" className="stroke-athloniq-lime/60" />
      )}
      {kind === "workout" && (
        <>
          <path d="M16 18h32" className="stroke-athloniq-lime/60" />
          <path d="M20 12v12M44 12v12M14 14v8M50 14v8" className="stroke-slate-400" />
        </>
      )}
      {kind === "nutrition" && (
        <>
          <circle cx="32" cy="18" r="9" className="stroke-athloniq-lime/60" />
          <path d="M32 13v5l3 2" className="stroke-slate-400" />
        </>
      )}
      {kind === "recovery" && (
        <path
          d="M10 18h10l4-6 5 12 4-6h21"
          className="stroke-emerald-400/60"
        />
      )}
    </svg>
  );
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  illustration = "trend",
  className,
}) => {
  return (
    <div
      className={cn(
        "surface-well rounded-xl p-4 space-y-2.5 border-l-2 border-l-amber-400/70",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <EmptyIllustration kind={illustration} />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-200">{title}</div>
          <p className="text-xs text-slate-400 leading-relaxed tabular-nums">
            {description}
          </p>
        </div>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
