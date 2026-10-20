import React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  icon?: React.ReactNode;
  glow?: "lime" | "emerald" | "violet" | "none" | "cyan";
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  trend,
  icon,
  glow = "none",
  badge,
}) => {
  return (
    <Card glow={glow} className="relative overflow-hidden group hover:border-white/[0.14] transition-all duration-150">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {title}
            </p>
            {badge}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white font-mono tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-zinc-400 font-mono tabular-nums">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium tabular-nums">
              <span
                className={cn(
                  trend.positive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {trend.value}
              </span>
              <span className="text-zinc-500">vs 7d avg</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-[#181D2A] p-3 text-athloniq-lime border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] group-hover:scale-105 transition-transform duration-150">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
