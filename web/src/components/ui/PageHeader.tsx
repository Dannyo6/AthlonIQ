import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTile } from "./IconTile";

export interface PageHeaderProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  id = "page-heading",
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  className,
}) => {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <IconTile icon={icon} tone="lime" size="lg" className="mt-0.5" />}
        <div className="space-y-1 min-w-0">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest tabular-nums">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
              <span>{eyebrow}</span>
            </div>
          )}
          <h1
            id={id}
            tabIndex={-1}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight focus:outline-none"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};
