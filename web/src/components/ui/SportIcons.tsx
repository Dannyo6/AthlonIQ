import React from "react";
import { cn } from "@/lib/utils";

export interface SportIconProps {
  className?: string;
  label?: string;
  decorative?: boolean;
}

function getA11yProps(decorative: boolean, label?: string) {
  if (!decorative && label) {
    return { role: "img" as const, "aria-label": label };
  }
  return { "aria-hidden": true as const };
}

export const BadmintonIcon: React.FC<SportIconProps> = ({
  className,
  label = "Badminton shuttlecock",
  decorative = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4 shrink-0", className)}
    {...getA11yProps(decorative, label)}
  >
    <path d="M9 17.5 15 11.5" />
    <path d="M6.5 20a2.5 2.5 0 0 1-2.5-2.5c0-.8.35-1.55.9-2.05L9 17.5l2.05 2.05c-.5.55-1.25.9-2.05.9a2.5 2.5 0 0 1-2.5-.45Z" />
    <path d="M11 13.5 14 4l3 1 3 3 1 3-9.5 3" />
    <path d="m14 9 3 3" />
  </svg>
);

export const RunningIcon: React.FC<SportIconProps> = ({
  className,
  label = "Running",
  decorative = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4 shrink-0", className)}
    {...getA11yProps(decorative, label)}
  >
    <circle cx="15" cy="5" r="2" />
    <path d="M10 10.5 13 8l3 2.5 3-1" />
    <path d="m13 8-2.5 5 3.5 2.5L12.5 20" />
    <path d="M10.5 13 7 15.5l-2-.5" />
  </svg>
);

export const PullUpIcon: React.FC<SportIconProps> = ({
  className,
  label = "Pull-up",
  decorative = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-4 w-4 shrink-0", className)}
    {...getA11yProps(decorative, label)}
  >
    <path d="M3 5h18" />
    <path d="M8 5v4l4 2 4-2V5" />
    <circle cx="12" cy="9" r="1.5" />
    <path d="M12 11v6" />
    <path d="m10 17 1 4" />
    <path d="m14 17-1 4" />
  </svg>
);

export type SportIconKind = "badminton" | "running" | "pull-up";

export const SportIcon: React.FC<SportIconProps & { sport: SportIconKind }> = ({
  sport,
  ...rest
}) => {
  if (sport === "badminton") return <BadmintonIcon {...rest} />;
  if (sport === "running") return <RunningIcon {...rest} />;
  return <PullUpIcon {...rest} />;
};
