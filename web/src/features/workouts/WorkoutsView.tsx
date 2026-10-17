import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  Dumbbell,
  Plus,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const WorkoutsView: React.FC = () => {
  const { equipment } = useAthloniqState();
  const [activeTab, setActiveTab] = useState<"active" | "history" | "routines">("active");

  const unconfirmedEquipment = equipment.filter((i) => !i.isConfirmed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Dumbbell className="h-6 w-6 text-athloniq-lime" />
            Training & Progressive Overload Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Auto-regulated resistance training, volume load tracking, and equipment-constrained progression loops.
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" /> Start Live Workout Session
        </Button>
      </div>

      {/* Equipment Warning Banner if historical items are unconfirmed */}
      {unconfirmedEquipment.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{unconfirmedEquipment.length} Home Gym Items Pending Confirmation</span>
                <ProvenanceBadge provenance="unconfirmed_equipment" />
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                Your historical home setup (Bench, Rack, Dips, Pulldown, 70kg Free Weights) is currently unconfirmed. Exercise prescriptions are limited until verified.
              </p>
            </div>
          </div>
          <Badge variant="amber">UNCONFIRMED HOME GYM</Badge>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E2330] pb-2">
        {(["active", "routines", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
              activeTab === tab
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "text-slate-400 hover:text-white hover:bg-[#181D2A]"
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
            equipmentReq: "Bench, Dumbbells, Rack",
          },
          {
            title: "Lower Body Quad Bias (B)",
            focus: "Quads, Adductors, Calves",
            duration: "75m",
            exercises: 5,
            lastDone: "5 days ago",
            volume: "16,800 kg",
            equipmentReq: "Squat Rack, Barbell",
          },
          {
            title: "Posterior Chain & Arms (C)",
            focus: "Hamstrings, Glutes, Biceps, Triceps",
            duration: "60m",
            exercises: 6,
            lastDone: "1 week ago",
            volume: "14,200 kg",
            equipmentReq: "Free Weights, Pulldown",
          },
        ].map((routine, idx) => (
          <Card key={idx} className="space-y-4 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{routine.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{routine.focus}</p>
              </div>
              <Badge variant="lime">{routine.duration}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-[#1E2330]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Dumbbell className="h-3.5 w-3.5 text-athloniq-lime" />
                <span className="font-mono tabular-nums">{routine.exercises} Exercises</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono tabular-nums">{routine.volume}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{routine.lastDone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Overload Ready</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Equipment: {routine.equipmentReq}
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
