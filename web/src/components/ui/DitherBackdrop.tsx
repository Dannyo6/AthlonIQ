import React, { Suspense } from "react";
import type { DitherRgbTuple } from "./Dither";

const LazyDither = React.lazy(() => import("./Dither"));

const CARBON_BG: DitherRgbTuple = [0.027, 0.031, 0.035];
const HERO_WAVE: DitherRgbTuple = [0.063, 0.24, 0.165];
const HERO_ACCENT: DitherRgbTuple = [0.42, 0.64, 0.2];
const AMBIENT_WAVE: DitherRgbTuple = [0.045, 0.145, 0.105];
const AMBIENT_ACCENT: DitherRgbTuple = [0.22, 0.36, 0.14];

export interface DitherBackdropProps {
  mode: "hero" | "ambient";
}

const DitherBackdropInner: React.FC<DitherBackdropProps> = ({ mode }) => {
  const isHero = mode === "hero";

  return (
    <>
      <div
        className={`athloniq-dither-layer z-0 transition-opacity duration-500 ${
          isHero ? "opacity-70" : "opacity-25"
        }`}
        aria-hidden="true"
      >
        <Suspense fallback={null}>
          <LazyDither
            baseColor={CARBON_BG}
            waveColor={isHero ? HERO_WAVE : AMBIENT_WAVE}
            accentColor={isHero ? HERO_ACCENT : AMBIENT_ACCENT}
            ditherMode="bayer"
            colorNum={4}
            pixelSize={isHero ? 2 : 3}
            waveSpeed={isHero ? 0.035 : 0.016}
            waveFrequency={isHero ? 2.8 : 2.4}
            waveAmplitude={isHero ? 0.28 : 0.22}
            mouseEffect={isHero ? "reveal" : "none"}
            mouseRadius={0.28}
            mouseStrength={0.6}
            enableMouseInteraction={isHero}
            clickRipple={isHero}
            intro={isHero}
            dpr={isHero ? 1.5 : 1}
          />
        </Suspense>
      </div>
      <div
        className={`fixed inset-0 z-0 pointer-events-none ${
          isHero ? "auth-dither-vignette" : "ambient-dither-vignette"
        }`}
        aria-hidden="true"
      />
    </>
  );
};

export const DitherBackdrop = React.memo(DitherBackdropInner);
