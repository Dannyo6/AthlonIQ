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
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-athloniq-cyan/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-athloniq-cyan to-cyan-400 text-slate-950 font-semibold shadow-glow hover:shadow-cyan-500/40 hover:brightness-105",
    secondary:
      "bg-athloniq-surface hover:bg-slate-700/80 text-white border border-slate-700/60",
    outline:
      "border border-slate-700 hover:border-athloniq-cyan hover:text-athloniq-cyan text-slate-300 bg-transparent",
    ghost: "text-slate-400 hover:text-white hover:bg-athloniq-surface/50",
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
