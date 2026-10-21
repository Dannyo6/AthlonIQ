import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft, ShieldAlert } from "lucide-react";

export const NotFoundView: React.FC = () => {
  useEffect(() => {
    document.title = "Page Not Found — AthlonIQ";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#12151E] border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-athloniq-lime/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-athloniq-lime mx-auto flex items-center justify-center shadow-glow-lime">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" />
            <span>404 Out of Bounds</span>
          </div>
          <h1
            id="page-heading"
            tabIndex={-1}
            className="text-2xl font-black text-white tracking-tight focus:outline-none"
          >
            Page Not Found
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            The requested trajectory does not exist in AthlonIQ OS. The route may have been relocated or entered incorrectly.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/today"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-bold text-xs text-slate-950 bg-athloniq-lime hover:bg-[#a3e635] transition-all shadow-glow-lime hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Today Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
