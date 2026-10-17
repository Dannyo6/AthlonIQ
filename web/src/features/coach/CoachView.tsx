import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { Bot, Send, Sparkles, User, Dumbbell, ShieldCheck } from "lucide-react";

interface Message {
  id: string;
  sender: "athlete" | "coach";
  text: string;
  timestamp: string;
  recommendation?: string;
}

export const CoachView: React.FC = () => {
  const { profile, readiness, todayCheckIn, goals } = useAthloniqState();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "coach",
      text: `Greetings ${profile.fullName}. I've ingested your latest check-in data: self-reported sleep is ${todayCheckIn.sleepHours.toFixed(1)} hours (Quality: ${todayCheckIn.sleepQuality}/5), muscle soreness is ${todayCheckIn.soreness}/5, yielding a deterministic Readiness score of ${readiness.readinessScore}% (${readiness.status}). Your target protein is ${goals.proteinTargetG} g/day. How can we optimize today's protocol?`,
      timestamp: "10:30 AM",
      recommendation: readiness.guidance,
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

    // Simulate deterministic AI Coach response
    setTimeout(() => {
      const coachReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        text: `Understood. Given your current ${readiness.status} readiness (${readiness.readinessScore}%) and 5-day training scope, focus on clean execution within RPE 7.5-8.5. Maintain 2-3 minutes of inter-set rest on compound lifts to ensure high motor unit recruitment.`,
        timestamp: "Just now",
        recommendation: "Keep rest intervals >= 120s on working sets.",
      };
      setMessages((prev) => [...prev, coachReply]);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Bot className="h-6 w-6 text-athloniq-lime" />
            AI Performance & Biomechanics Coach
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Grounded athletic intelligence synthesized from your auditable biometrics, equipment constraints, and check-in readiness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            GEMINI ENGINE ONLINE
          </Badge>
          <Badge variant="emerald">
            <ShieldCheck className="h-3 w-3 mr-1 inline" />
            ZERO PII EXPOSURE
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
                    ? "bg-athloniq-lime/20 text-athloniq-lime border border-athloniq-lime/40"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                }`}
              >
                {msg.sender === "athlete" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === "athlete"
                    ? "bg-[#181D2A] text-white border border-[#1E2330] rounded-tr-none"
                    : "bg-[#12151E] text-slate-200 border border-[#1E2330] rounded-tl-none"
                }`}
              >
                <p>{msg.text}</p>
                {msg.recommendation && (
                  <div className="mt-3 pt-3 border-t border-[#1E2330] flex items-center gap-2 text-xs font-medium text-athloniq-lime">
                    <Dumbbell className="h-3.5 w-3.5" />
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
        <div className="px-6 py-2.5 bg-[#181D2A] border-t border-[#1E2330] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
          {[
            "Should I attempt progressive overload today?",
            "How do I time protein intake around badminton?",
            "What substitute can I do with a 70kg dumbbell limit?",
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#12151E] hover:bg-[#202738] text-slate-300 transition-colors border border-[#1E2330]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-[#12151E] border-t border-[#1E2330] flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your AI coach regarding workouts, nutrition, or recovery..."
            className="flex-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-athloniq-lime"
          />
          <Button variant="primary" onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
