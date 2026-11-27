import React from "react";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  decorative?: boolean;
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, { box: string; svg: string }> = {
  sm: { box: "h-7 w-7 rounded-lg", svg: "h-4 w-4" },
  md: { box: "h-9 w-9 rounded-xl", svg: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-2xl", svg: "h-6 w-6" },
};

/**
 * Reusable AthlonIQ emblem container.
 * Swap the inline SVG here when a custom brand asset is introduced without editing any view.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size = "md",
  decorative = true,
  label = "AthlonIQ emblem",
  className,
}) => {
  const styles = SIZE_CLASSES[size];

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-athloniq-card border border-athloniq-lime/45 shadow-glow-lime",
        styles.box,
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("text-athloniq-lime", styles.svg)}
        aria-hidden="true"
      >
        <path d="M5 3h14l2 2v14l-2 2H5l-2-2V5l2-2Z" className="stroke-athloniq-lime/25" />
        <path d="M6.5 18.5 11.4 6h1.2l4.9 12.5" />
        <path d="m8.8 13.8 3.6-1.4-.8 2.4 3.6-1.4" />
      </svg>
    </span>
  );
};
