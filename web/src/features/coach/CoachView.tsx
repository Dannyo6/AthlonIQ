import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bot, Send, Sparkles, User, Dumbbell, ShieldCheck } from "lucide-react";

interface Message {
  id: string;
  sender: "athlete" | "coach";
  text: string;
  timestamp: string;
  recommendation?: string;
}

export const CoachView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "coach",
      text: "Greetings Athlete. I've ingested your latest telemetry: HRV is up +11.5% (58ms), sleep reached 7.8 hours with 2h 15m deep sleep, and yesterday was a rest day. Your central nervous system is primed. How can we optimize today's protocol?",
      timestamp: "10:30 AM",
      recommendation: "Ready for progressive overload on compound lifts.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const athleteMsg: Message = {
      id: Date.now().toString(),
      sender: "athlete",
      text: input,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, athleteMsg]);
    setInput("");

    // Simulate AI Coach response
    setTimeout(() => {
      const coachReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        text: `Understood. Given your current metabolic expenditure and 88% readiness, maintain your planned 2,650 kcal target. On your working sets for Upper Body, push for 1 extra rep on the first set before increasing load. Remember to maintain 3-minute inter-set recovery for full ATP re-synthesis.`,
        timestamp: "Just now",
        recommendation: "Keep rest intervals >= 180s on heavy pressing.",
      };
      setMessages((prev) => [...prev, coachReply]);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-athloniq-violet" />
            AI Performance & Biomechanics Coach
          </h1>
          <p className="text-sm text-slate-400">
            Real-time multi-modal athletic guidance powered by Google Gemini, grounded in your real-time biometric telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="violet">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            GEMINI ENGINE ONLINE
          </Badge>
          <Badge variant="emerald">
            <ShieldCheck className="h-3 w-3 mr-1 inline" />
            SATS SYNCHRONIZED
          </Badge>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex flex-col h-[540px] p-0 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "athlete" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === "athlete"
                    ? "bg-athloniq-cyan/20 text-athloniq-cyan border border-athloniq-cyan/40"
                    : "bg-athloniq-violet/20 text-athloniq-violet border border-athloniq-violet/40"
                }`}
              >
                {msg.sender === "athlete" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === "athlete"
                    ? "bg-athloniq-surface text-white border border-slate-700/80 rounded-tr-none"
                    : "bg-slate-900/90 text-slate-200 border border-athloniq-violet/20 rounded-tl-none shadow-glow-violet/10"
                }`}
              >
                <p>{msg.text}</p>
                {msg.recommendation && (
                  <div className="mt-3 pt-3 border-t border-athloniq-violet/20 flex items-center gap-2 text-xs font-medium text-purple-300">
                    <Dumbbell className="h-3.5 w-3.5 text-athloniq-cyan" />
                    <span>{msg.recommendation}</span>
                  </div>
                )}
                <span className="block mt-1 text-[10px] text-slate-500 text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 shrink-0 font-medium">Prompt Quick Picks:</span>
          {[
            "Should I attempt a PR on bench press today?",
            "What should my pre-workout meal timing be?",
            "How do I adjust training if I felt lower back tightness?",
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your AI coach anything regarding workouts, nutrition, or recovery..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-athloniq-cyan"
          />
          <Button variant="primary" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
