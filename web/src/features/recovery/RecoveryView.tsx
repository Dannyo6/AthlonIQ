import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Moon, HeartPulse, Activity } from "lucide-react";

export const RecoveryView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Moon className="h-6 w-6 text-athloniq-cyan" />
            Biometric Recovery & Readiness Engine
          </h1>
          <p className="text-sm text-slate-400">
            HRV (rMSSD) trend modeling, sleep architecture profiling, and autonomic recovery assessment.
          </p>
        </div>
        <Badge variant="emerald">AUTONOMIC TONE: PARASYMPATHETIC DOMINANT</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="HRV (rMSSD)"
          value="58"
          unit="ms"
          subtitle="Baseline: 52 ms"
          trend={{ value: "+11.5%", positive: true }}
          icon={<HeartPulse className="h-6 w-6 text-athloniq-cyan" />}
          glow="cyan"
        />
        <StatCard
          title="Resting Heart Rate"
          value="48"
          unit="bpm"
          subtitle="Baseline: 51 bpm"
          trend={{ value: "-3 bpm", positive: true }}
          icon={<Activity className="h-6 w-6 text-athloniq-emerald" />}
          glow="emerald"
        />
        <StatCard
          title="Deep Sleep Staging"
          value="2h 15m"
          subtitle="28% of total sleep duration"
          trend={{ value: "+30m", positive: true }}
          icon={<Moon className="h-6 w-6 text-athloniq-violet" />}
          glow="violet"
        />
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-white text-lg">7-Day Recovery Readiness Curve</h3>
        <p className="text-xs text-slate-400">
          Composite score incorporating nocturnal HRV, sleep depth, resting pulse, and self-reported soreness index.
        </p>

        {/* Visual mock chart bars */}
        <div className="pt-4 grid grid-cols-7 gap-2 h-44 items-end">
          {[
            { day: "Mon", score: 82 },
            { day: "Tue", score: 76 },
            { day: "Wed", score: 68 },
            { day: "Thu", score: 85 },
            { day: "Fri", score: 74 },
            { day: "Sat", score: 91 },
            { day: "Sun", score: 88 },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[11px] font-mono text-slate-300 font-bold">{item.score}</span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-athloniq-surface to-athloniq-cyan transition-all duration-300 hover:brightness-125"
                style={{ height: `${(item.score / 100) * 110}px` }}
              />
              <span className="text-xs text-slate-400 font-medium">{item.day}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
