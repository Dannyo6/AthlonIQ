import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Utensils, Droplets, Plus } from "lucide-react";

export const NutritionView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="h-6 w-6 text-athloniq-emerald" />
            Dynamic Nutrition & Metabolic System
          </h1>
          <p className="text-sm text-slate-400">
            Katch-McArdle TDEE tracking, training-day carbohydrate cycling, and protein distribution.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Log Meal
        </Button>
      </div>

      {/* Daily Progress Bars */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-athloniq-emerald uppercase font-semibold">Today's Energy Balance</span>
            <h3 className="text-xl font-bold text-white">1,840 / 2,650 kcal (810 kcal Remaining)</h3>
          </div>
          <Badge variant="emerald">LEAN BULK (+250 KCAL SURPLUS)</Badge>
        </div>

        {/* Macro split breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[
            {
              label: "Protein",
              current: 145,
              target: 180,
              unit: "g",
              color: "bg-athloniq-cyan",
              textColor: "text-athloniq-cyan",
            },
            {
              label: "Carbohydrates",
              current: 210,
              target: 285,
              unit: "g",
              color: "bg-athloniq-amber",
              textColor: "text-athloniq-amber",
            },
            {
              label: "Fats",
              current: 44,
              target: 65,
              unit: "g",
              color: "bg-athloniq-rose",
              textColor: "text-athloniq-rose",
            },
          ].map((macro, idx) => {
            const pct = Math.min(100, Math.round((macro.current / macro.target) * 100));
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{macro.label}</span>
                  <span className={`font-mono font-bold ${macro.textColor}`}>
                    {macro.current} / {macro.target} {macro.unit}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${macro.color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hydration */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-athloniq-cyan/10 text-athloniq-cyan">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Daily Hydration</div>
              <div className="text-xs text-slate-400">2,800 / 3,800 ml (73% of target)</div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            + 250 ml
          </Button>
        </div>
      </Card>
    </div>
  );
};
