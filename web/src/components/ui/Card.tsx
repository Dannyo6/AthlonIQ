import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "lime" | "emerald" | "violet" | "none" | "cyan";
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  glow = "none",
  hoverEffect = false,
  children,
  ...props
}) => {
  const glowStyles = {
    none: "",
    lime: "shadow-glow-lime border-athloniq-lime/40",
    cyan: "shadow-glow-lime border-athloniq-lime/40",
    emerald: "shadow-glow-emerald border-athloniq-emerald/40",
    violet: "shadow-glow-violet border-athloniq-violet/40",
  }[glow];

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200 bg-[#12151E] border border-[#1E2330] text-slate-100",
        hoverEffect && "surface-hover",
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
