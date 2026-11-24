import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkoutTemplate } from "@/types";
import { Play } from "lucide-react";

export interface WorkoutTemplatePickerProps {
  templates: WorkoutTemplate[];
  onStartTemplate: (template: WorkoutTemplate) => void;
}

export const WorkoutTemplatePicker: React.FC<WorkoutTemplatePickerProps> = ({
  templates,
  onStartTemplate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((tmpl) => (
        <Card key={tmpl.id} className="space-y-4 hover:border-slate-700 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white">{tmpl.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{tmpl.focus}</p>
            </div>
            <Badge variant="lime" className="tabular-nums font-mono">
              Est. {tmpl.estimatedDurationMin}m
            </Badge>
          </div>
          <div className="space-y-1.5 border-t border-athloniq-border pt-3">
            {tmpl.exercises.map((ex, idx) => (
              <div key={ex.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  {idx + 1}. {ex.exerciseName}
                </span>
                <span className="text-slate-500 font-mono tabular-nums">
                  {ex.targetSets}×{ex.targetRepsMin}–{ex.targetRepsMax}
                </span>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            className="w-full min-h-[44px]"
            onClick={() => onStartTemplate(tmpl)}
          >
            <Play className="h-4 w-4" /> Start This Template
          </Button>
        </Card>
      ))}
    </div>
  );
};
