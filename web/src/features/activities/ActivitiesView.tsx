import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Activity, Flame, Plus, Heart } from "lucide-react";

export const ActivitiesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-athloniq-amber" />
            Endurance & Daily Activity Telemetry
          </h1>
          <p className="text-sm text-slate-400">
            Zone 2 aerobic conditioning, steps, and energy expenditure tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="amber">AEROBIC BASE: ZONE 2</Badge>
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Log Cardio Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Daily Steps</span>
            <Activity className="h-4 w-4 text-athloniq-amber" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            9,420 <span className="text-sm text-slate-400 font-normal">/ 10,000</span>
          </div>
          <p className="text-xs text-athloniq-emerald font-medium">94% of non-exercise NEAT goal</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Zone 2 Aerobic Base</span>
            <Heart className="h-4 w-4 text-athloniq-rose" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            45 <span className="text-sm text-slate-400 font-normal">min</span>
          </div>
          <p className="text-xs text-slate-400">Avg HR 132 bpm (Mitochondrial Target)</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Active Burn</span>
            <Flame className="h-4 w-4 text-athloniq-cyan" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            610 <span className="text-sm text-slate-400 font-normal">kcal</span>
          </div>
          <p className="text-xs text-slate-400">Integrated into dynamic TDEE</p>
        </Card>
      </div>
    </div>
  );
};
