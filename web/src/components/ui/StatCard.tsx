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
  glow?: "cyan" | "emerald" | "violet" | "none";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  trend,
  icon,
  glow = "none",
}) => {
  return (
    <Card glow={glow} className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400 font-mono">
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              <span
                className={cn(
                  trend.positive ? "text-athloniq-emerald" : "text-athloniq-rose"
                )}
              >
                {trend.value}
              </span>
              <span className="text-slate-500">vs 7d avg</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-slate-800/80 p-3 text-athloniq-cyan border border-slate-700/50 group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
