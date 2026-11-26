import React from "react";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";

interface CoachComposerProps {
  input: string;
  isLoading: boolean;
  isOnline: boolean;
  onInputChange: (val: string) => void;
  onSend: (prompt: string) => void;
}

export const CoachComposer: React.FC<CoachComposerProps> = ({
  input,
  isLoading,
  isOnline,
  onInputChange,
  onSend,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOnline && input.trim() && !isLoading) {
      onSend(input);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-athloniq-dark-nav border-t border-athloniq-border flex items-center gap-3"
    >
      <label htmlFor="coach-chat-input" className="sr-only">
        Message AI Performance Coach
      </label>
      <input
        id="coach-chat-input"
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isLoading || !isOnline}
        placeholder={
          !isOnline
            ? "AI Performance Coach is offline. Please reconnect to internet (offline AI not supported)."
            : "Ask about workouts, protein gap, equipment progression, or recovery..."
        }
        className="flex-1 min-h-[44px] min-w-0 bg-athloniq-surface border border-athloniq-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-athloniq-lime disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <Button
        type="submit"
        variant="primary"
        aria-label="Send message to AI Coach"
        className="min-h-[44px] min-w-[44px] shrink-0"
        disabled={!input.trim() || isLoading || !isOnline}
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
};
