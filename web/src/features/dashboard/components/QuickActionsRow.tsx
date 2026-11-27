import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Dumbbell, Scale, Moon } from "lucide-react";
import { IconTile } from "@/components/ui/IconTile";

export const QuickActionsRow: React.FC = () => {
  const actions = [
    { label: "Log meal", to: "/nutrition", icon: Utensils, accent: "lime" as const },
    { label: "Start workout", to: "/workouts", icon: Dumbbell, accent: "emerald" as const },
    { label: "Log weight", to: "/progress", icon: Scale, accent: "lime" as const },
    { label: "Check-in", to: "/recovery", icon: Moon, accent: "emerald" as const },
  ];

  return (
    <nav
      aria-label="Quick actions"
      className="stagger-enter grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3"
    >
      {actions.map((act) => (
        <Link
          key={act.label}
          to={act.to}
          className="surface-card surface-hover tactile-press min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-center sm:justify-start gap-2.5 text-xs font-semibold text-white select-none"
        >
          <IconTile icon={act.icon} tone={act.accent} size="sm" />
          <span className="truncate">{act.label}</span>
        </Link>
      ))}
    </nav>
  );
};
