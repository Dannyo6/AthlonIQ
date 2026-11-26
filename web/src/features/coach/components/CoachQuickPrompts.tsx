import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { QUICK_PROMPTS } from "../constants";

interface CoachQuickPromptsProps {
  disabled: boolean;
  onSelectPrompt: (prompt: string) => void;
}

export const CoachQuickPrompts: React.FC<CoachQuickPromptsProps> = ({
  disabled,
  onSelectPrompt,
}) => {
  return (
    <div
      aria-label="Quick prompts"
      className="px-4 py-3 bg-athloniq-card-alt border-t border-athloniq-border flex flex-wrap items-center gap-2 text-xs"
    >
      <span className="text-slate-400 shrink-0 font-medium text-xs flex items-center gap-1">
        <Sparkles className="h-3.5 w-3.5 text-athloniq-lime" aria-hidden="true" />
        <span>Quick Prompts:</span>
      </span>
      {QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelectPrompt(prompt)}
          disabled={disabled}
          className="min-h-[44px] max-w-full px-3 py-1.5 rounded-lg bg-athloniq-surface hover:bg-athloniq-surface-alt text-slate-300 hover:text-white transition-colors border border-athloniq-border-alt text-xs text-left flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-athloniq-lime/60"
        >
          <span className="break-words">{prompt}</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};
