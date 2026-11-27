import React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { IconTile, IconTileProps } from "./IconTile";
import { ProvenanceDot } from "./Badge";
import type { DisplayBadge, Provenance } from "@/types";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: IconTileProps["tone"];
  provenance?: Provenance | DisplayBadge;
  headerRight?: React.ReactNode;
  primaryAction?: React.ReactNode;
  spotlight?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  tone = "lime",
  provenance,
  headerRight,
  primaryAction,
  spotlight = false,
  className,
  children,
}) => {
  return (
    <Card
      spotlight={spotlight}
      className={cn("h-full flex flex-col justify-between space-y-4", className)}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <IconTile icon={icon} tone={tone} size="sm" />}
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-white tracking-wide leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {provenance && <ProvenanceDot provenance={provenance} />}
            {headerRight}
          </div>
        </div>

        <div>{children}</div>
      </div>

      {primaryAction && <div className="pt-1">{primaryAction}</div>}
    </Card>
  );
};
