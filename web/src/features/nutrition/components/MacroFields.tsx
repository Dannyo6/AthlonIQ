import React from "react";

export interface MacroValues {
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

export type MacroFieldName = keyof MacroValues;

export interface MacroErrors {
  caloriesKcal?: string | null;
  proteinG?: string | null;
  carbsG?: string | null;
  fatG?: string | null;
}

/**
 * Validates a macro string input:
 * - Empty / blank string => "Required"
 * - Non-numeric string => "Must be a valid number"
 * - Negative number => "Must be ≥ 0"
 * - Explicit 0 or positive number => null (valid)
 */
export function validateMacroInput(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "Required";
  }
  const parsed = Number(trimmed);
  if (isNaN(parsed)) {
    return "Must be a valid number";
  }
  if (parsed < 0) {
    return "Must be ≥ 0";
  }
  return null;
}

/**
 * Parses a validated macro string input to a deterministic number.
 * Returns null if invalid or blank. Explicit 0 returns 0.
 */
export function parseMacroInput(value: string): number | null {
  const error = validateMacroInput(value);
  if (error !== null) {
    return null;
  }
  return parseFloat(value.trim());
}

/**
 * Checks if all four macro inputs are valid and non-blank.
 */
export function validateAllMacros(values: MacroValues): {
  isValid: boolean;
  errors: MacroErrors;
  parsed: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
} {
  const errors: MacroErrors = {
    caloriesKcal: validateMacroInput(values.caloriesKcal),
    proteinG: validateMacroInput(values.proteinG),
    carbsG: validateMacroInput(values.carbsG),
    fatG: validateMacroInput(values.fatG),
  };

  const isValid =
    !errors.caloriesKcal &&
    !errors.proteinG &&
    !errors.carbsG &&
    !errors.fatG;

  if (!isValid) {
    return { isValid: false, errors, parsed: null };
  }

  return {
    isValid: true,
    errors,
    parsed: {
      caloriesKcal: parseFloat(values.caloriesKcal.trim()),
      proteinG: parseFloat(values.proteinG.trim()),
      carbsG: parseFloat(values.carbsG.trim()),
      fatG: parseFloat(values.fatG.trim()),
    },
  };
}

interface MacroFieldsProps {
  values: MacroValues;
  onChange: (field: MacroFieldName, value: string) => void;
  errors?: MacroErrors;
  showErrors?: boolean;
}

const FIELD_CONFIG: {
  key: MacroFieldName;
  label: string;
  step: string;
  placeholder: string;
}[] = [
  { key: "caloriesKcal", label: "Calories (kcal) *", step: "0.1", placeholder: "e.g. 250" },
  { key: "proteinG", label: "Protein (g) *", step: "0.1", placeholder: "e.g. 20" },
  { key: "carbsG", label: "Carbs (g) *", step: "0.1", placeholder: "e.g. 30" },
  { key: "fatG", label: "Fat (g) *", step: "0.1", placeholder: "e.g. 5" },
];

export const MacroFields: React.FC<MacroFieldsProps> = ({
  values,
  onChange,
  errors = {},
  showErrors = false,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="macro-fields-grid">
      {FIELD_CONFIG.map(({ key, label, step, placeholder }) => {
        const value = values[key];
        const error = errors[key];
        const hasError = Boolean(showErrors && error);

        return (
          <div key={key} className="space-y-1">
            <label
              htmlFor={`macro-input-${key}`}
              className="text-[11px] text-slate-400 font-medium block"
            >
              {label}
            </label>
            <input
              id={`macro-input-${key}`}
              data-testid={`macro-input-${key}`}
              type="number"
              min="0"
              step={step}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
              className={`w-full min-h-[44px] bg-athloniq-surface border rounded-xl px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none transition-colors ${
                hasError
                  ? "border-rose-500/80 focus:border-rose-400 bg-rose-950/20"
                  : "border-athloniq-border focus:border-athloniq-lime"
              }`}
            />
            {hasError && (
              <p
                role="alert"
                data-testid={`macro-error-${key}`}
                className="text-[10px] text-rose-400 font-medium tracking-tight"
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
