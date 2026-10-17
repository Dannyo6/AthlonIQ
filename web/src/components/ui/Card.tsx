import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "emerald" | "violet" | "none";
}

export const Card: React.FC<CardProps> = ({
  className,
  glow = "none",
  children,
  ...props
}) => {
  const glowStyles = {
    none: "",
    cyan: "shadow-glow border-athloniq-cyan/30",
    emerald: "shadow-glow-emerald border-athloniq-emerald/30",
    violet: "shadow-glow-violet border-athloniq-violet/30",
  }[glow];

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-6 transition-all duration-200",
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
