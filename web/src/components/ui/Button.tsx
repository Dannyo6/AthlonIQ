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
    "inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-athloniq-lime/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 min-h-[36px] text-xs gap-1.5",
    md: "px-4 py-2.5 min-h-[44px] text-sm gap-2",
    lg: "px-6 py-3.5 min-h-[48px] text-base gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-athloniq-lime hover:bg-athloniq-lime-hover text-slate-950 font-bold shadow-glow-lime shadow-[inset_0_1px_0_0_rgba(255,255,255,0.30)] hover:brightness-105 active:scale-[0.99]",
    secondary:
      "bg-[#141824] hover:bg-[#1C2234] text-white border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-white/[0.16]",
    outline:
      "border border-white/[0.12] hover:border-athloniq-lime/60 hover:text-athloniq-lime text-slate-300 bg-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
    ghost: "text-slate-400 hover:text-white hover:bg-white/[0.05]",
    danger:
      "bg-athloniq-rose/15 text-rose-300 border border-rose-500/30 hover:bg-athloniq-rose/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
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
