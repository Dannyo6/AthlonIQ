import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "emerald" | "violet" | "amber" | "rose" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "cyan",
  children,
  ...props
}) => {
  const variantStyles = {
    cyan: "bg-athloniq-cyan/10 text-athloniq-cyan border-athloniq-cyan/30",
    emerald: "bg-athloniq-emerald/10 text-athloniq-emerald border-athloniq-emerald/30",
    violet: "bg-athloniq-violet/10 text-purple-400 border-athloniq-violet/30",
    amber: "bg-athloniq-amber/10 text-amber-400 border-athloniq-amber/30",
    rose: "bg-athloniq-rose/10 text-rose-400 border-athloniq-rose/30",
    neutral: "bg-slate-800 text-slate-300 border-slate-700",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide",
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
