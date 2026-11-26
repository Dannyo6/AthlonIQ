import React, { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { usePwa } from "@/features/pwa/usePwa";
import { fetchWeeklyReview, sendCoachChatTurn } from "@/services/api";
import { EpistemicCoachMessage, WeeklyReviewReport } from "@/types";
import { Bot, ShieldCheck, Sparkles } from "lucide-react";
import { buildOfflineWeeklyReport } from "./constants";
import { useCoachFormDirty } from "./hooks/useCoachFormDirty";
import { CoachSubTabs, CoachTabId } from "./components/CoachSubTabs";
import { CoachChatPanel } from "./components/CoachChatPanel";
import { CoachWeeklyReviewPanel } from "./components/CoachWeeklyReviewPanel";

export interface CoachViewProps {
  now?: string | Date;
}

export const CoachView: React.FC<CoachViewProps> = ({ now }) => {
  const {
    profile,
    goals,
    preferences,
    updatePreferences,
    coachMessages,
    addCoachMessage,
    clearCoachMessages,
    applyProposedAction,
    dismissProposedAction,
    getCoachingSnapshot,
  } = useAthloniqState();

  const [activeTab, setActiveTab] = useState<CoachTabId>("chat");
  const { isOnline } = usePwa();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);

  const [weeklyReport, setWeeklyReport] = useState<WeeklyReviewReport | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);

  useCoachFormDirty(Boolean(input.trim()));

  const handleLoadWeeklyReview = useCallback(async () => {
    setIsLoadingReview(true);
    setReviewError(null);
    try {
      const snapshot = getCoachingSnapshot();
      const report = await fetchWeeklyReview(snapshot);
      if (report) {
        setWeeklyReport(report);
      }
    } catch {
      const snapshot = getCoachingSnapshot();
      const offlineReport = buildOfflineWeeklyReport(snapshot, {
        proteinMinG: goals.proteinMinG ?? null,
        proteinMaxG: goals.proteinMaxG ?? null,
        proteinTargetG: goals.proteinTargetG ?? null,
        trainingDaysPerWeek: profile.trainingDaysPerWeek,
        weightKg: profile.weightKg,
        timezone: preferences?.timezone,
        now,
      });
      setWeeklyReport(offlineReport);
      setReviewError(
        "Weekly review needs a connection for live AI synthesis (local offline synthesis active)"
      );
    } finally {
      setIsLoadingReview(false);
    }
  }, [
    getCoachingSnapshot,
    goals.proteinMaxG,
    goals.proteinMinG,
    goals.proteinTargetG,
    now,
    preferences?.timezone,
    profile.trainingDaysPerWeek,
    profile.weightKg,
  ]);

  useEffect(() => {
    if (activeTab === "review" && !weeklyReport) {
      void handleLoadWeeklyReview();
    }
  }, [activeTab, weeklyReport, handleLoadWeeklyReview]);

  const handleSendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const isRetry = failedPrompt === trimmed;
    setChatError(null);
    setFailedPrompt(null);

    if (!isRetry) {
      const userMessage: EpistemicCoachMessage = {
        id: Date.now().toString(),
        sender: "athlete",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      addCoachMessage(userMessage);
    }
    setInput("");
    setIsLoading(true);

    try {
      const snapshot = getCoachingSnapshot();
      const response = await sendCoachChatTurn(trimmed, snapshot);

      const assistantMsg: EpistemicCoachMessage = {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        text: response.reply_markdown,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolsUsed: response.tools_used,
        factsFromTools: response.facts_from_tools,
        appCalculations: response.app_calculations,
        recommendations: response.recommendations,
        missingOrUncertain: response.missing_or_uncertain,
        proposedAction: response.proposed_action
          ? {
              ...response.proposed_action,
              payload: response.proposed_action.payload ?? {},
              status: "pending",
            }
          : null,
      };

      addCoachMessage(assistantMsg);
    } catch {
      setFailedPrompt(trimmed);
      setChatError(
        "Unable to reach AI Performance Coach. No response was fabricated — retry once connected."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationTestStatus("Notifications not supported in this browser.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const athleteLabel = profile.fullName || "Athlete";
        const quietSummary =
          preferences?.quietHoursStart && preferences?.quietHoursEnd
            ? `${preferences.quietHoursStart} – ${preferences.quietHoursEnd}`
            : "Not set";
        new Notification("AthlonIQ Coach Reminder", {
          body: `${athleteLabel}, your quiet hours are ${quietSummary}. Time for your evening meal check-in!`,
          icon: "/favicon.ico",
        });
        setNotificationTestStatus("Notification sent successfully! (Permission granted)");
        updatePreferences({ notificationsEnabled: true });
      } else {
        setNotificationTestStatus(`Notification permission: ${perm}`);
      }
    } catch {
      setNotificationTestStatus("Failed to request notification permission.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Bot className="h-6 w-6 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span>Personal AI Coach &amp; Biomechanics OS</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Grounded athletic intelligence synthesized strictly via 8 allowlisted typed tools over
            verified biometrics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="lime">
            <Sparkles className="h-3 w-3 mr-1 inline" aria-hidden="true" />8 TYPED TOOLS
          </Badge>
          <Badge variant="emerald">
            <ShieldCheck className="h-3 w-3 mr-1 inline" aria-hidden="true" />
            ZERO PII EXPOSURE
          </Badge>
        </div>
      </div>

      <CoachSubTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === "chat" && (
        <CoachChatPanel
          profile={profile}
          isOnline={isOnline}
          messages={coachMessages}
          input={input}
          isLoading={isLoading}
          chatError={chatError}
          failedPrompt={failedPrompt}
          onInputChange={setInput}
          onSendPrompt={handleSendPrompt}
          onClearMessages={clearCoachMessages}
          onApplyProposedAction={applyProposedAction}
          onDismissProposedAction={dismissProposedAction}
        />
      )}

      {activeTab === "review" && (
        <CoachWeeklyReviewPanel
          isOnline={isOnline}
          isLoadingReview={isLoadingReview}
          reviewError={reviewError}
          weeklyReport={weeklyReport}
          profile={profile}
          preferences={preferences ?? {}}
          notificationTestStatus={notificationTestStatus}
          onRegenerate={() => void handleLoadWeeklyReview()}
          onUpdatePreferences={updatePreferences}
          onTestNotification={() => void handleTestNotification()}
        />
      )}
    </div>
  );
};
