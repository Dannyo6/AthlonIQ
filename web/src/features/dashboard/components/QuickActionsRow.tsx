import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Dumbbell, Scale, Moon } from "lucide-react";

export const QuickActionsRow: React.FC = () => {
  const actions = [
    {
      label: "Log meal",
      to: "/nutrition",
      icon: Utensils,
      color: "text-athloniq-lime",
      bgColor: "bg-athloniq-card hover:bg-athloniq-card-alt",
      borderColor: "border-athloniq-border hover:border-athloniq-lime/40",
    },
    {
      label: "Start workout",
      to: "/workouts",
      icon: Dumbbell,
      color: "text-athloniq-lime",
      bgColor: "bg-athloniq-card hover:bg-athloniq-card-alt",
      borderColor: "border-athloniq-border hover:border-athloniq-lime/40",
    },
    {
      label: "Log weight",
      to: "/progress",
      icon: Scale,
      color: "text-athloniq-lime",
      bgColor: "bg-athloniq-card hover:bg-athloniq-card-alt",
      borderColor: "border-athloniq-border hover:border-athloniq-lime/40",
    },
    {
      label: "Check-in",
      to: "/recovery",
      icon: Moon,
      color: "text-athloniq-lime",
      bgColor: "bg-athloniq-card hover:bg-athloniq-card-alt",
      borderColor: "border-athloniq-border hover:border-athloniq-lime/40",
    },
  ];

  return (
    <nav
      aria-label="Quick actions"
      className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
    >
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.label}
            to={act.to}
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl ${act.bgColor} border ${act.borderColor} flex items-center justify-center gap-2 text-xs font-bold text-white transition-all shadow-sm active:scale-[0.98] select-none`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${act.color}`} />
            <span>{act.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

