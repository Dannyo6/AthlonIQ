import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-athloniq-lime/40 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-athloniq-lime hover:bg-athloniq-lime-hover text-slate-950 font-bold shadow-glow-lime hover:brightness-105 active:scale-[0.98]",
    secondary:
      "bg-[#181D2A] hover:bg-[#202738] text-white border border-[#1E2330] hover:border-slate-700",
    outline:
      "border border-[#1E2330] hover:border-athloniq-lime hover:text-athloniq-lime text-slate-300 bg-transparent",
    ghost: "text-slate-400 hover:text-white hover:bg-[#181D2A]/60",
    danger:
      "bg-athloniq-rose/20 text-rose-300 border border-rose-500/30 hover:bg-athloniq-rose/30",
  }[variant];

  return (
    <button
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      {...props}
    >
      {children}
    </button>
  );
};
