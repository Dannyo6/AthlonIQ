import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Activity, Flame, Plus, Heart } from "lucide-react";

export const ActivitiesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Activity className="h-6 w-6 text-athloniq-lime" />
            Endurance & Daily Activity Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Zone 2 aerobic conditioning, badminton energy expenditure, and NEAT step metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">HYBRID ATHLETE SCOPE</Badge>
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Log Cardio Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Daily Steps</span>
            <Activity className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            9,420 <span className="text-sm text-slate-400 font-normal">/ 10,000</span>
          </div>
          <p className="text-xs text-emerald-400 font-medium">94% of non-exercise NEAT goal</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Zone 2 Aerobic Base</span>
            <Heart className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            45 <span className="text-sm text-slate-400 font-normal">min</span>
          </div>
          <p className="text-xs text-slate-400">Conversational steady-state conditioning</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Badminton & Running</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            3 <span className="text-sm text-slate-400 font-normal">sessions/wk</span>
          </div>
          <p className="text-xs text-slate-400">Integrated into weekly energy balance</p>
        </Card>
      </div>
    </div>
  );
};
