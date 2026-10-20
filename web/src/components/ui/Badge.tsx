import React from "react";
import { cn } from "@/lib/utils";

export type ProvenanceType =
  | "provisional_default"
  | "calculated_estimate"
  | "user_confirmed"
  | "ai_estimated"
  | "awaiting_onboarding"
  | "unconfirmed_equipment";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "lime" | "emerald" | "violet" | "amber" | "rose" | "neutral" | "cyan";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "lime",
  children,
  ...props
}) => {
  const variantStyles = {
    lime: "bg-athloniq-lime/15 text-lime-300 border-lime-400/30 shadow-[inset_0_1px_0_0_rgba(190,242,100,0.15)]",
    cyan: "bg-athloniq-lime/15 text-lime-300 border-lime-400/30 shadow-[inset_0_1px_0_0_rgba(190,242,100,0.15)]",
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
  provenance: ProvenanceType | string;
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
      style: "bg-athloniq-lime/15 text-lime-300 border-lime-400/40 font-semibold",
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
