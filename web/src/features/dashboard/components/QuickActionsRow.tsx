import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Dumbbell, Scale, Moon } from "lucide-react";

export const QuickActionsRow: React.FC = () => {
  const actions = [
    { label: "Log meal", to: "/nutrition", icon: Utensils, accent: "lime" as const },
    { label: "Start workout", to: "/workouts", icon: Dumbbell, accent: "emerald" as const },
    { label: "Log weight", to: "/progress", icon: Scale, accent: "lime" as const },
    { label: "Check-in", to: "/recovery", icon: Moon, accent: "emerald" as const },
  ];

  return (
    <nav aria-label="Quick actions" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
      {actions.map((act) => {
        const Icon = act.icon;
        const iconBoxClass =
          act.accent === "emerald"
            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            : "bg-athloniq-lime/15 border-athloniq-lime/30 text-athloniq-lime";

        return (
          <Link
            key={act.label}
            to={act.to}
            className="surface-card surface-hover tactile-press min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-white select-none"
          >
            <span
              className={`p-1.5 rounded-lg border shrink-0 ${iconBoxClass}`}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="truncate">{act.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
