import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconTileProps {
  icon: LucideIcon | React.ReactNode;
  tone?: "lime" | "emerald" | "neutral" | "amber" | "rose";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<IconTileProps["tone"]>, string> = {
  lime: "bg-athloniq-lime/15 border-athloniq-lime/30 text-athloniq-lime",
  emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  neutral: "bg-athloniq-well border-white/[0.08] text-slate-300",
  amber: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  rose: "bg-rose-500/15 border-rose-500/30 text-rose-400",
};

const CONTAINER_SIZES: Record<NonNullable<IconTileProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-11 w-11 rounded-xl",
};

const ICON_SIZES: Record<NonNullable<IconTileProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

function isLucideComponent(icon: LucideIcon | React.ReactNode): icon is LucideIcon {
  return (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null && "$$typeof" in icon && "render" in icon)
  );
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  tone = "lime",
  size = "md",
  label,
  className,
}) => {
  const IconComp = isLucideComponent(icon) ? icon : null;

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex items-center justify-center border shrink-0",
        TONE_CLASSES[tone],
        CONTAINER_SIZES[size],
        className
      )}
    >
      {IconComp ? (
        <IconComp className={ICON_SIZES[size]} strokeWidth={2} aria-hidden="true" />
      ) : (
        (icon as React.ReactNode)
      )}
    </span>
  );
};
