import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "lime" | "emerald" | "violet" | "none";
  hoverEffect?: boolean;
  spotlight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  glow = "none",
  hoverEffect = false,
  spotlight = false,
  onMouseMove,
  children,
  ...props
}) => {
  const glowStyles = {
    none: "",
    lime: "shadow-glow-lime border-athloniq-lime/40",
    emerald: "shadow-glow-emerald border-athloniq-emerald/40",
    violet: "shadow-glow-violet border-athloniq-violet/40",
  }[glow];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (spotlight) {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--card-spot-x", `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty("--card-spot-y", `${e.clientY - rect.top}px`);
    }
    onMouseMove?.(e);
  };

  return (
    <div
      onMouseMove={spotlight || onMouseMove ? handleMouseMove : undefined}
      className={cn(
        "surface-card rounded-2xl p-6 transition-all duration-150 text-slate-100",
        hoverEffect && "surface-hover",
        spotlight && "card-spotlight",
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
