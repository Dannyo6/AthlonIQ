import React from "react";

export const RouteLoadingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading view content..."
      className="space-y-6 animate-pulse select-none"
    >
      {/* Top Heading Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-white/[0.08] rounded-xl" />
          <div className="h-4 w-72 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-white/[0.06] rounded-xl" />
      </div>

      {/* Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#12151E] border border-white/[0.07] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-white/[0.06] rounded" />
              <div className="h-5 w-5 bg-white/[0.08] rounded-lg" />
            </div>
            <div className="h-6 w-24 bg-white/[0.08] rounded-lg" />
            <div className="h-2 w-full bg-white/[0.04] rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Content Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-[#12151E] border border-white/[0.07] space-y-4">
            <div className="h-5 w-36 bg-white/[0.08] rounded-lg" />
            <div className="h-40 bg-white/[0.03] rounded-xl border border-white/[0.04]" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-10 bg-white/[0.05] rounded-xl" />
              <div className="h-10 bg-white/[0.05] rounded-xl" />
              <div className="h-10 bg-white/[0.05] rounded-xl" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#12151E] border border-white/[0.07] space-y-4">
            <div className="h-5 w-28 bg-white/[0.08] rounded-lg" />
            <div className="h-24 bg-white/[0.03] rounded-xl border border-white/[0.04]" />
            <div className="h-20 bg-white/[0.03] rounded-xl border border-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
};
