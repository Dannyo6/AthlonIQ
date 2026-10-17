import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dumbbell, Plus, Flame, Clock, CheckCircle2 } from "lucide-react";

export const WorkoutsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"active" | "history" | "routines">("active");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-athloniq-cyan" />
            Workout & Progressive Overload Engine
          </h1>
          <p className="text-sm text-slate-400">
            Auto-regulated resistance training, volume load tracking, and rep-in-reserve (RIR) telemetry.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Start Empty Session
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {(["active", "routines", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-athloniq-cyan/10 text-athloniq-cyan border border-athloniq-cyan/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            {tab} Sessions
          </button>
        ))}
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Upper Body Hypertrophy (A)",
            focus: "Chest, Lats, Side Delts",
            duration: "65m",
            exercises: 6,
            lastDone: "3 days ago",
            volume: "12,400 kg",
          },
          {
            title: "Lower Body Quad Bias (B)",
            focus: "Quads, Adductors, Calves",
            duration: "75m",
            exercises: 5,
            lastDone: "5 days ago",
            volume: "16,800 kg",
          },
          {
            title: "Posterior Chain & Arms (C)",
            focus: "Hamstrings, Glutes, Biceps, Triceps",
            duration: "60m",
            exercises: 6,
            lastDone: "1 week ago",
            volume: "14,200 kg",
          },
        ].map((routine, idx) => (
          <Card key={idx} className="space-y-4 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{routine.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{routine.focus}</p>
              </div>
              <Badge variant="cyan">{routine.duration}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Dumbbell className="h-3.5 w-3.5 text-athloniq-cyan" />
                <span>{routine.exercises} Exercises</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Flame className="h-3.5 w-3.5 text-athloniq-amber" />
                <span>{routine.volume}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{routine.lastDone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-athloniq-emerald">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Overload Ready</span>
              </div>
            </div>

            <Button variant="secondary" className="w-full">
              Start This Routine
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
