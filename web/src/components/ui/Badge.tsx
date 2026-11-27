import React from "react";
import { cn } from "@/lib/utils";
import type { DisplayBadge, Provenance } from "@/types";

export type ProvenanceType = Provenance | DisplayBadge;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "lime" | "emerald" | "violet" | "amber" | "rose" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "lime",
  children,
  ...props
}) => {
  const variantStyles = {
    lime: "bg-athloniq-lime/15 text-athloniq-lime border-athloniq-lime/30 shadow-[inset_0_1px_0_0_rgba(190,242,100,0.15)]",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15)]",
    violet: "bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-[inset_0_1px_0_0_rgba(168,85,247,0.15)]",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.15)]",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.15)]",
    neutral: "bg-zinc-800/80 text-zinc-300 border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wider uppercase tabular-nums",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

interface ProvenanceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  provenance: Provenance | DisplayBadge;
  labelOverride?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  labelOverride,
  className,
  ...props
}) => {
  const config: Record<
    string,
    { label: string; style: string }
  > = {
    provisional_default: {
      label: "PROVISIONAL (1.6–2.2G/KG)",
      style: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    },
    calculated_estimate: {
      label: "CALCULATED ESTIMATE",
      style: "bg-athloniq-lime/15 text-athloniq-lime border-athloniq-lime/40 font-semibold",
    },
    user_confirmed: {
      label: "USER CONFIRMED",
      style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    },
    awaiting_onboarding: {
      label: "AWAITING ONBOARDING",
      style: "bg-zinc-800/80 text-zinc-400 border-zinc-700/60",
    },
    unconfirmed_equipment: {
      label: "UNCONFIRMED EQUIPMENT",
      style: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    },
    ai_estimated: {
      label: "AI ESTIMATED",
      style: "bg-purple-500/15 text-purple-300 border-purple-500/40",
    },
  };

  const current = config[provenance] || {
    label: provenance.replace(/_/g, " ").toUpperCase(),
    style: "bg-zinc-800/80 text-zinc-400 border-zinc-700/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider uppercase tabular-nums",
        current.style,
        className
      )}
      {...props}
    >
      {labelOverride || current.label}
    </span>
  );
};

interface ProvenanceDotProps {
  provenance: Provenance | DisplayBadge;
  compact?: boolean;
  className?: string;
}

const PROVENANCE_COPY: Record<string, { label: string; dotClass: string }> = {
  user_confirmed: { label: "Confirmed by you", dotClass: "bg-emerald-400" },
  manual_entry: { label: "Manual entry", dotClass: "bg-emerald-400" },
  user_corrected: { label: "Corrected by you", dotClass: "bg-emerald-400" },
  verified_reference: { label: "Verified reference", dotClass: "bg-emerald-400" },
  calculated_estimate: { label: "Calculated from your logs", dotClass: "bg-athloniq-lime" },
  provisional_default: { label: "Initial baseline estimate", dotClass: "bg-amber-400" },
  awaiting_onboarding: { label: "Setup incomplete", dotClass: "bg-slate-400" },
  unconfirmed_equipment: { label: "Equipment unconfirmed", dotClass: "bg-amber-400" },
  ai_estimated: { label: "AI estimate (needs review)", dotClass: "bg-amber-400" },
};

export const ProvenanceDot: React.FC<ProvenanceDotProps> = ({
  provenance,
  compact = false,
  className,
}) => {
  const entry = PROVENANCE_COPY[provenance] || {
    label: provenance.replace(/_/g, " "),
    dotClass: "bg-slate-400",
  };

  if (compact) {
    return (
      <span
        title={entry.label}
        aria-label={entry.label}
        className={cn(
          "inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-white/[0.06] shrink-0",
          className
        )}
      >
        <span className={cn("h-2 w-2 rounded-full shrink-0", entry.dotClass)} aria-hidden="true" />
        <span className="sr-only">{entry.label}</span>
      </span>
    );
  }

  return (
    <span
      title={entry.label}
      className={cn("inline-flex items-center gap-1.5 text-[11px] text-slate-400", className)}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", entry.dotClass)} aria-hidden="true" />
      <span className="truncate">{entry.label}</span>
    </span>
  );
};
