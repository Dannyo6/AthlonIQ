import React from "react";
import { Button } from "@/components/ui/Button";
import { EpistemicCoachMessage, ProposedCoachAction } from "@/types";
import {
  AlertTriangle,
  Bot,
  Calculator,
  CheckCircle2,
  Compass,
  RefreshCw,
  User,
  Zap,
} from "lucide-react";

interface CoachMessageListProps {
  messages: EpistemicCoachMessage[];
  isLoading: boolean;
  chatError: string | null;
  failedPrompt: string | null;
  onRetryPrompt: (prompt: string) => void;
  onApplyProposedAction: (messageId: string, action: ProposedCoachAction) => void;
  onDismissProposedAction: (messageId: string) => void;
}

export const CoachMessageList: React.FC<CoachMessageListProps> = ({
  messages,
  isLoading,
  chatError,
  failedPrompt,
  onRetryPrompt,
  onApplyProposedAction,
  onDismissProposedAction,
}) => {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={isLoading}
      aria-label="AI Coach conversation messages"
      className="flex-1 overflow-y-auto p-5 space-y-5"
    >
      {messages.length === 0 ? (
        <div className="text-center py-12 px-4 text-slate-400 space-y-2">
          <Bot className="h-8 w-8 mx-auto text-slate-500" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-300">No messages in this conversation yet.</p>
          <p className="text-xs text-slate-500">
            Select a quick prompt below or ask about your workouts, protein target, or readiness.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "athlete" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.sender === "athlete"
                  ? "bg-athloniq-lime/20 text-athloniq-lime border border-athloniq-lime/40"
                  : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              }`}
              aria-hidden="true"
            >
              {msg.sender === "athlete" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                msg.sender === "athlete"
                  ? "bg-athloniq-surface text-white border border-athloniq-border-alt rounded-tr-none"
                  : "bg-athloniq-card text-slate-200 border border-athloniq-surface-alt rounded-tl-none shadow-md"
              }`}
            >
              <div className="text-sm font-normal whitespace-pre-line text-slate-100">
                {msg.text}
              </div>

              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-athloniq-surface-alt">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 self-center">
                    Tools Invoked:
                  </span>
                  {msg.toolsUsed.map((tool, idx) => (
                    <span
                      key={`${tool}-${idx}`}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-athloniq-surface text-athloniq-lime border border-athloniq-lime/30"
                    >
                      {tool}()
                    </span>
                  ))}
                </div>
              )}

              {msg.sender === "coach" &&
                Boolean(
                  msg.factsFromTools?.length ||
                    msg.appCalculations?.length ||
                    msg.recommendations?.length ||
                    msg.missingOrUncertain?.length
                ) && (
                  <div className="space-y-2 pt-2 border-t border-athloniq-surface-alt text-xs">
                    {msg.factsFromTools && msg.factsFromTools.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-athloniq-lime/10 border border-athloniq-lime/30 text-athloniq-lime">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-athloniq-lime flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          <span>Verified Tool Facts</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {msg.factsFromTools.map((fact, i) => (
                            <li key={i}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.appCalculations && msg.appCalculations.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-300 flex items-center gap-1.5 mb-1">
                          <Calculator className="h-3 w-3" aria-hidden="true" />
                          <span>AthlonIQ Deterministic Calculations</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 font-mono tabular-nums">
                          {msg.appCalculations.map((calc, i) => (
                            <li key={i}>{calc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border-alt text-slate-200">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-purple-300 flex items-center gap-1.5 mb-1">
                          <Compass className="h-3 w-3" aria-hidden="true" />
                          <span>Coach Recommendations</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {msg.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.missingOrUncertain && msg.missingOrUncertain.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-amber-300 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          <span>Missing / Uncertain Data Notice</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {msg.missingOrUncertain.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {msg.proposedAction && (
                <div className="mt-3 p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-lime/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-athloniq-lime uppercase tracking-wider flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Proposed Action (Requires Explicit Confirmation)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-athloniq-card text-slate-400 border border-athloniq-border">
                      {msg.proposedAction.type}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">{msg.proposedAction.summary}</p>

                  {msg.proposedAction.status === "applied" ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Action Confirmed &amp; Applied to Live Records</span>
                    </div>
                  ) : msg.proposedAction.status === "dismissed" ? (
                    <div className="text-xs text-slate-400 italic bg-athloniq-card p-2 rounded-lg border border-athloniq-border">
                      Action dismissed. No records were modified.
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onApplyProposedAction(msg.id, msg.proposedAction!)}
                        className="min-h-[44px] text-xs font-bold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        Confirm &amp; Apply
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onDismissProposedAction(msg.id)}
                        className="min-h-[44px] text-xs"
                      >
                        Dismiss
                      </Button>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        Never mutates without your click
                      </span>
                    </div>
                  )}
                </div>
              )}

              <span className="block mt-1 text-[10px] text-slate-400 text-right font-mono tabular-nums">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))
      )}

      {isLoading && (
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center animate-pulse shrink-0"
            aria-hidden="true"
          >
            <Bot className="h-4 w-4" />
          </div>
          <div className="px-4 py-3 rounded-2xl bg-athloniq-card border border-athloniq-surface-alt text-xs text-slate-300 flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-athloniq-lime" aria-hidden="true" />
            <span>Executing allowlisted tools and synthesizing grounded response...</span>
          </div>
        </div>
      )}

      {chatError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{chatError}</span>
          </div>
          {failedPrompt && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs shrink-0 self-start sm:self-auto"
              onClick={() => onRetryPrompt(failedPrompt)}
            >
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
              Retry Send
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
