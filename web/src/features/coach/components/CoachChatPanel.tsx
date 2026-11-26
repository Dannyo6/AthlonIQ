import React from "react";
import { Card } from "@/components/ui/Card";
import { PwaOfflineEmptyState } from "@/features/pwa/PwaComponents";
import { EpistemicCoachMessage, ProposedCoachAction, UserProfile } from "@/types";
import { CoachContextSummary } from "./CoachContextSummary";
import { CoachMessageList } from "./CoachMessageList";
import { CoachQuickPrompts } from "./CoachQuickPrompts";
import { CoachComposer } from "./CoachComposer";

interface CoachChatPanelProps {
  profile: Partial<UserProfile>;
  isOnline: boolean;
  messages: EpistemicCoachMessage[];
  input: string;
  isLoading: boolean;
  chatError: string | null;
  failedPrompt: string | null;
  onInputChange: (val: string) => void;
  onSendPrompt: (prompt: string) => void;
  onClearMessages: () => void;
  onApplyProposedAction: (messageId: string, action: ProposedCoachAction) => void;
  onDismissProposedAction: (messageId: string) => void;
}

export const CoachChatPanel: React.FC<CoachChatPanelProps> = ({
  profile,
  isOnline,
  messages,
  input,
  isLoading,
  chatError,
  failedPrompt,
  onInputChange,
  onSendPrompt,
  onClearMessages,
  onApplyProposedAction,
  onDismissProposedAction,
}) => {
  return (
    <div
      role="tabpanel"
      id="coach-panel-chat"
      aria-labelledby="coach-tab-chat"
      className="space-y-4"
    >
      <CoachContextSummary profile={profile} onClearHistory={onClearMessages} />

      {!isOnline && <PwaOfflineEmptyState featureName="AI Performance Coach" />}

      <Card
        spotlight
        className="flex flex-col h-[600px] p-0 overflow-hidden border-athloniq-border bg-athloniq-dark-nav"
      >
        <CoachMessageList
          messages={messages}
          isLoading={isLoading}
          chatError={chatError}
          failedPrompt={failedPrompt}
          onRetryPrompt={onSendPrompt}
          onApplyProposedAction={onApplyProposedAction}
          onDismissProposedAction={onDismissProposedAction}
        />

        <CoachQuickPrompts disabled={isLoading || !isOnline} onSelectPrompt={onSendPrompt} />

        <CoachComposer
          input={input}
          isLoading={isLoading}
          isOnline={isOnline}
          onInputChange={onInputChange}
          onSend={onSendPrompt}
        />
      </Card>
    </div>
  );
};
