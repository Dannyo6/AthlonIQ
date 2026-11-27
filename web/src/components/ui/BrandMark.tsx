import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  decorative?: boolean;
  label?: string;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

/**
 * Reusable AthlonIQ AlphaWave geometric hardware-squircle emblem.
 * Uses CSS custom properties exclusively so dark surface and lime/emerald tones remain synchronized.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size = "md",
  decorative = true,
  label = "AthlonIQ emblem",
  className,
}) => {
  const uid = useId().replace(/:/g, "");
  const bevelId = `ath-bevel-${uid}`;

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none drop-shadow-sm",
        SIZE_CLASSES[size],
        className
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bevelId} x1="24" y1="1" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-lime)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--color-border)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="12"
          fill="var(--color-surface)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="12"
          stroke={`url(#${bevelId})`}
          strokeWidth="1.5"
        />
        <path
          d="M25.6029 11.2749C23.2598 8.93179 19.4608 8.93179 17.1176 11.2749L8.63236 19.7602C6.28921 22.1034 6.28921 25.9024 8.63236 28.2455L17.1176 36.7308C19.4608 39.0739 23.2598 39.0739 25.6029 36.7308L29.6516 32.6821C26.2812 31.3818 23.8901 28.1113 23.8901 24.2823C23.8901 20.3007 26.4755 16.9231 30.0591 15.7366C29.9891 15.6629 29.9179 15.5899 29.8456 15.5176L25.6029 11.2749Z"
          fill="var(--color-lime)"
        />
        <path
          d="M29.6523 32.6848C30.6571 33.0724 31.7489 33.2849 32.8904 33.2849C37.8609 33.2849 41.8904 29.2555 41.8904 24.2849C41.8904 19.3143 37.8609 15.2849 32.8904 15.2849C31.9015 15.2849 30.9499 15.4444 30.0599 15.739C34.5316 20.4401 34.4605 27.8767 29.8464 32.4907L29.6523 32.6848Z"
          fill="var(--color-emerald)"
          opacity="0.78"
        />
      </svg>
    </span>
  );
};
