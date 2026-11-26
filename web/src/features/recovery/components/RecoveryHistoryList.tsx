import React from "react";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { RecoveryCheckIn } from "@/types";
import { Calendar } from "lucide-react";

interface RecoveryHistoryListProps {
  entries: RecoveryCheckIn[];
}

export const RecoveryHistoryList: React.FC<RecoveryHistoryListProps> = ({ entries }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">Recent Check-in Log</h3>
        <ProvenanceBadge provenance="manual_entry" />
      </div>

      {entries.length === 0 ? (
        <Card className="text-center py-10 text-slate-400 space-y-1.5">
          <Calendar className="h-8 w-8 mx-auto text-slate-600" />
          <p className="text-sm">No recovery check-ins logged yet.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {[...entries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <Card
                key={entry.date}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-white tabular-nums">
                    {entry.date}
                  </div>
                  <div className="text-xs text-slate-400 font-mono tabular-nums flex flex-wrap gap-x-3 gap-y-1">
                    <span>Sleep: {entry.sleepHours.toFixed(1)} hrs</span>
                    <span>Quality: {entry.sleepQuality}/5</span>
                    <span>Soreness: {entry.soreness}/5</span>
                    <span>Fatigue: {entry.fatigue}/5</span>
                    <span>
                      Stress: {entry.stress !== null ? `${entry.stress}/5` : "Not set"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};
