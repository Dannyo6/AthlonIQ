import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { User, Shield, Target, Activity } from "lucide-react";

export const ProfileView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="h-6 w-6 text-athloniq-cyan" />
            Athlete Identity & Baseline Matrix
          </h1>
          <p className="text-sm text-slate-400">
            Biometric anchors, anthropometry, goal configurations, and training tier classification.
          </p>
        </div>
        <Badge variant="cyan">TIER: ADVANCED ATHLETE</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-athloniq-cyan/20 border border-athloniq-cyan/40 flex items-center justify-center text-athloniq-cyan font-bold text-lg">
              AI
            </div>
            <div>
              <h3 className="font-bold text-white">Alex Mercer</h3>
              <p className="text-xs text-slate-400">alex.mercer@athloniq.io</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Age</span>
              <span className="font-mono text-white font-medium">28 yrs</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Height</span>
              <span className="font-mono text-white font-medium">182 cm (6'0")</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Experience</span>
              <span className="text-athloniq-emerald font-semibold">6 Years Lifting</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-athloniq-emerald" />
            <h3 className="font-bold text-white">Active Goal Vector</h3>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="text-xs font-semibold text-athloniq-emerald uppercase">Primary Focus</div>
            <div className="text-base font-bold text-white">Hypertrophy & Lean Accrual</div>
            <p className="text-xs text-slate-400">Target Weight: 80.5 kg at ~12% Body Fat</p>
          </div>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Caloric Strategy</span>
              <span className="text-white font-medium">+250 kcal Lean Surplus</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weekly Frequency</span>
              <span className="text-white font-medium">5 Resistance / 2 Zone 2</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-athloniq-violet" />
            <h3 className="font-bold text-white">Privacy & RLS Status</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-athloniq-emerald">
              <Activity className="h-4 w-4" />
              <span>Row-Level Security Active (Supabase)</span>
            </div>
            <div className="flex items-center gap-2 text-athloniq-emerald">
              <Activity className="h-4 w-4" />
              <span>Sanitized Gemini AI Prompts (Zero PII)</span>
            </div>
            <div className="flex items-center gap-2 text-athloniq-emerald">
              <Activity className="h-4 w-4" />
              <span>Encrypted Biometric Telemetry</span>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Export Athlete Telemetry Archive
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
