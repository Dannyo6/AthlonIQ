import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Scale, X } from "lucide-react";

interface WeighInErrors {
  weight?: string;
  waist?: string;
  chest?: string;
  arm?: string;
}

interface ProgressWeighInDrawerProps {
  weightDate: string;
  weightInput: string;
  waistInput: string;
  chestInput: string;
  armInput: string;
  weightNotes: string;
  onWeightDateChange: (val: string) => void;
  onWeightInputChange: (val: string) => void;
  onWaistInputChange: (val: string) => void;
  onChestInputChange: (val: string) => void;
  onArmInputChange: (val: string) => void;
  onWeightNotesChange: (val: string) => void;
  onSubmit: (parsed: {
    loggedDate: string;
    weightKg: number;
    waistCm: number | null;
    chestCm: number | null;
    armCm: number | null;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

function validateWeight(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter body weight in kg.";
  const val = Number(trimmed);
  if (!Number.isFinite(val) || val < 20 || val > 300) {
    return "Weight must be between 20 and 300 kg.";
  }
  return undefined;
}

function validateOptionalMeasure(
  raw: string,
  label: string,
  min: number,
  max: number
): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const val = Number(trimmed);
  if (!Number.isFinite(val) || val < min || val > max) {
    return `${label} must be between ${min} and ${max} cm.`;
  }
  return undefined;
}

export const ProgressWeighInDrawer: React.FC<ProgressWeighInDrawerProps> = ({
  weightDate,
  weightInput,
  waistInput,
  chestInput,
  armInput,
  weightNotes,
  onWeightDateChange,
  onWeightInputChange,
  onWaistInputChange,
  onChestInputChange,
  onArmInputChange,
  onWeightNotesChange,
  onSubmit,
  onCancel,
}) => {
  const weightInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<WeighInErrors>({});

  useEffect(() => {
    weightInputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: WeighInErrors = {
      weight: validateWeight(weightInput),
      waist: validateOptionalMeasure(waistInput, "Waist", 40, 200),
      chest: validateOptionalMeasure(chestInput, "Chest", 40, 200),
      arm: validateOptionalMeasure(armInput, "Arm", 15, 100),
    };

    const hasError = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    if (hasError) {
      if (nextErrors.weight) weightInputRef.current?.focus();
      return;
    }

    onSubmit({
      loggedDate: weightDate,
      weightKg: Number(weightInput.trim()),
      waistCm: waistInput.trim() ? Number(waistInput.trim()) : null,
      chestCm: chestInput.trim() ? Number(chestInput.trim()) : null,
      armCm: armInput.trim() ? Number(armInput.trim()) : null,
      notes: weightNotes.trim() || undefined,
    });
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-athloniq-border pb-3 gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
          <span>Log Weigh-In</span>
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="lime">REQUIRED: 3 weigh-ins for 7-day rolling trend</Badge>
          <button
            type="button"
            aria-label="Close weigh-in form"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-athloniq-surface transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label htmlFor="weighin-date" className="text-xs text-slate-400 font-medium">
              Date
            </label>
            <input
              id="weighin-date"
              type="date"
              value={weightDate}
              onChange={(e) => onWeightDateChange(e.target.value)}
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="weighin-weight" className="text-xs text-slate-400 font-medium">
              Weight (kg) *
            </label>
            <input
              ref={weightInputRef}
              id="weighin-weight"
              type="number"
              min="20"
              max="300"
              step="0.1"
              value={weightInput}
              aria-invalid={Boolean(errors.weight)}
              aria-describedby={errors.weight ? "weighin-weight-error" : undefined}
              onBlur={() => setErrors((prev) => ({ ...prev, weight: validateWeight(weightInput) }))}
              onChange={(e) => {
                onWeightInputChange(e.target.value);
                if (errors.weight) {
                  setErrors((prev) => ({ ...prev, weight: validateWeight(e.target.value) }));
                }
              }}
              placeholder="e.g. 55.4"
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
            {errors.weight && (
              <p id="weighin-weight-error" role="alert" className="text-xs text-rose-400 mt-1">
                {errors.weight}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="weighin-waist" className="text-xs text-slate-400 font-medium">
              Waist (cm)
            </label>
            <input
              id="weighin-waist"
              type="number"
              min="40"
              max="200"
              step="0.5"
              value={waistInput}
              aria-invalid={Boolean(errors.waist)}
              aria-describedby={errors.waist ? "weighin-waist-error" : undefined}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  waist: validateOptionalMeasure(waistInput, "Waist", 40, 200),
                }))
              }
              onChange={(e) => {
                onWaistInputChange(e.target.value);
                if (errors.waist) {
                  setErrors((prev) => ({
                    ...prev,
                    waist: validateOptionalMeasure(e.target.value, "Waist", 40, 200),
                  }));
                }
              }}
              placeholder="optional"
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
            {errors.waist && (
              <p id="weighin-waist-error" role="alert" className="text-xs text-rose-400 mt-1">
                {errors.waist}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="weighin-chest" className="text-xs text-slate-400 font-medium">
              Chest (cm)
            </label>
            <input
              id="weighin-chest"
              type="number"
              min="40"
              max="200"
              step="0.5"
              value={chestInput}
              aria-invalid={Boolean(errors.chest)}
              aria-describedby={errors.chest ? "weighin-chest-error" : undefined}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  chest: validateOptionalMeasure(chestInput, "Chest", 40, 200),
                }))
              }
              onChange={(e) => {
                onChestInputChange(e.target.value);
                if (errors.chest) {
                  setErrors((prev) => ({
                    ...prev,
                    chest: validateOptionalMeasure(e.target.value, "Chest", 40, 200),
                  }));
                }
              }}
              placeholder="optional"
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
            {errors.chest && (
              <p id="weighin-chest-error" role="alert" className="text-xs text-rose-400 mt-1">
                {errors.chest}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="weighin-arm" className="text-xs text-slate-400 font-medium">
              Arm (cm)
            </label>
            <input
              id="weighin-arm"
              type="number"
              min="15"
              max="100"
              step="0.5"
              value={armInput}
              aria-invalid={Boolean(errors.arm)}
              aria-describedby={errors.arm ? "weighin-arm-error" : undefined}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  arm: validateOptionalMeasure(armInput, "Arm", 15, 100),
                }))
              }
              onChange={(e) => {
                onArmInputChange(e.target.value);
                if (errors.arm) {
                  setErrors((prev) => ({
                    ...prev,
                    arm: validateOptionalMeasure(e.target.value, "Arm", 15, 100),
                  }));
                }
              }}
              placeholder="optional"
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
            {errors.arm && (
              <p id="weighin-arm-error" role="alert" className="text-xs text-rose-400 mt-1">
                {errors.arm}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="weighin-notes" className="text-xs text-slate-400 font-medium">
              Notes
            </label>
            <input
              id="weighin-notes"
              type="text"
              value={weightNotes}
              onChange={(e) => onWeightNotesChange(e.target.value)}
              placeholder="Fasted AM, post-workout..."
              className="w-full min-h-[44px] mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" size="md" className="min-h-[44px]">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Save Weigh-In
          </Button>
          <Button type="button" variant="outline" size="md" className="min-h-[44px]" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
