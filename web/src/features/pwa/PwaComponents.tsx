import React from "react";
import {
  Download,
  RefreshCw,
  WifiOff,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Smartphone,
  AlertTriangle,
} from "lucide-react";

interface PwaUpdateBannerProps {
  needRefresh: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const PwaUpdateBanner: React.FC<PwaUpdateBannerProps> = ({
  needRefresh,
  onUpdate,
  onDismiss,
}) => {
  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[10000] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#12151E] border border-lime-400/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(163,230,53,0.2)] backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Update available</span>
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                A new performance release of AthlonIQ is ready. Reload to apply updates.
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
            aria-label="Dismiss update notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-colors"
          >
            Later
          </button>
          <button
            onClick={onUpdate}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-lime-400 hover:bg-lime-300 transition-all flex items-center gap-1.5 shadow-glow-lime cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface PwaOfflineBannerProps {
  isOnline: boolean;
}

export const PwaOfflineBanner: React.FC<PwaOfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2.5 text-xs flex items-center justify-between gap-3 sticky top-0 z-[9998] backdrop-blur-md">
      <div className="flex items-center gap-2.5 max-w-4xl mx-auto w-full">
        <WifiOff className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
        <div className="leading-snug">
          <span className="font-bold">Offline Mode:</span>{" "}
          <span className="text-amber-200/90">
            Network disconnected. Cached app shell loaded. Real-time AI coaching, meal vision, and cloud syncing require an active internet connection.
          </span>
        </div>
      </div>
    </div>
  );
};

interface PwaInstallCardProps {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  onInstall: () => Promise<boolean>;
}

export const PwaInstallCard: React.FC<PwaInstallCardProps> = ({
  canInstall,
  isInstalled,
  isIos,
  onInstall,
}) => {
  if (isInstalled) {
    return (
      <div className="rounded-2xl bg-[#12151E] p-4 border border-white/[0.08] flex items-center justify-between gap-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Standalone OS Mode Active</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              AthlonIQ is installed as an autonomous Progressive Web App.
            </div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[10px] font-mono font-bold tracking-wider">
          INSTALLED
        </div>
      </div>
    );
  }

  if (canInstall) {
    return (
      <div className="rounded-2xl bg-[#12151E] p-4 border border-lime-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(163,230,53,0.1)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-lime-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-glow-lime">
            AQ
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Install AthlonIQ App</span>
              <span className="px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 text-[9px] font-mono">
                PWA
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Fast standalone launch from your home screen or dock with zero browser chrome.
            </div>
          </div>
        </div>
        <button
          onClick={onInstall}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-lime-400 hover:bg-lime-300 transition-all flex items-center justify-center gap-2 shadow-glow-lime shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install Now</span>
        </button>
      </div>
    );
  }

  if (isIos) {
    return (
      <div className="rounded-2xl bg-[#12151E] p-4 border border-white/[0.08] space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-300">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="text-xs font-bold text-white">Install on iPhone / iPad</div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          To install AthlonIQ on iOS: Tap the <Share className="h-3 w-3 inline text-slate-300 mx-0.5" />{" "}
          <span className="text-slate-200 font-semibold">Share</span> icon in Safari toolbar, scroll down, and select{" "}
          <span className="text-lime-400 font-semibold">
            <PlusSquare className="h-3 w-3 inline mx-0.5" /> Add to Home Screen
          </span>.
        </p>
      </div>
    );
  }

  return null;
};

interface PwaOfflineEmptyStateProps {
  featureName: string;
}

export const PwaOfflineEmptyState: React.FC<PwaOfflineEmptyStateProps> = ({ featureName }) => {
  return (
    <div className="rounded-2xl bg-[#12151E] p-6 border border-amber-500/30 text-center space-y-3">
      <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
        <WifiOff className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{featureName} Requires Network</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          You are currently offline. {featureName} connects dynamically to cloud intelligence and cannot run disconnected. Offline meal syncing and offline AI are not supported.
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/[0.08] text-[11px] text-slate-400">
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        <span>Connect to Wi-Fi or cellular data to resume</span>
      </div>
    </div>
  );
};
