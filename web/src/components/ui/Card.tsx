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
        "rounded-2xl p-6 transition-all duration-150 bg-[#12151E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] text-slate-100",
        hoverEffect && "hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
