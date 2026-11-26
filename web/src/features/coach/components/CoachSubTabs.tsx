import React, { useRef } from "react";
import { Bot, Flame } from "lucide-react";

export type CoachTabId = "chat" | "review";

interface CoachSubTabsProps {
  activeTab: CoachTabId;
  onSelectTab: (tab: CoachTabId) => void;
}

export const CoachSubTabs: React.FC<CoachSubTabsProps> = ({ activeTab, onSelectTab }) => {
  const chatTabRef = useRef<HTMLButtonElement>(null);
  const reviewTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const next: CoachTabId =
        e.key === "Home"
          ? "chat"
          : e.key === "End"
          ? "review"
          : activeTab === "chat"
          ? "review"
          : "chat";
      onSelectTab(next);
      (next === "chat" ? chatTabRef : reviewTabRef).current?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Coach views"
      className="flex border-b border-athloniq-border gap-2 overflow-x-auto"
    >
      <button
        ref={chatTabRef}
        type="button"
        role="tab"
        id="coach-tab-chat"
        aria-selected={activeTab === "chat"}
        aria-controls="coach-panel-chat"
        tabIndex={activeTab === "chat" ? 0 : -1}
        onClick={() => onSelectTab("chat")}
        onKeyDown={handleKeyDown}
        className={`min-h-[44px] flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-athloniq-lime/60 ${
          activeTab === "chat"
            ? "border-athloniq-lime text-athloniq-lime bg-athloniq-lime/5"
            : "border-transparent text-slate-400 hover:text-white hover:bg-athloniq-card-alt"
        }`}
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        <span>AI Coach Chat</span>
      </button>

      <button
        ref={reviewTabRef}
        type="button"
        role="tab"
        id="coach-tab-review"
        aria-selected={activeTab === "review"}
        aria-controls="coach-panel-review"
        tabIndex={activeTab === "review" ? 0 : -1}
        onClick={() => onSelectTab("review")}
        onKeyDown={handleKeyDown}
        className={`min-h-[44px] flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-athloniq-lime/60 ${
          activeTab === "review"
            ? "border-athloniq-lime text-athloniq-lime bg-athloniq-lime/5"
            : "border-transparent text-slate-400 hover:text-white hover:bg-athloniq-card-alt"
        }`}
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        <span>Weekly Review &amp; Priorities</span>
      </button>
    </div>
  );
};
