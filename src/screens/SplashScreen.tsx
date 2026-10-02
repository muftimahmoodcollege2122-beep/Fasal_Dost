// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SplashScreen.tsx
// Play Store style minimalist launch splash screen with animated logo & clean white background
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Sprout } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number; // default 3000ms (3 seconds)
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 3000,
}) => {
  const [fading, setFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger smooth entrance animation
    const animTimer = setTimeout(() => {
      setMounted(true);
    }, 60);

    // Smooth fade-out transition before unmounting
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, Math.max(0, durationMs - 450));

    // Finish splash after specified duration (3 seconds)
    const endTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      className={`absolute inset-0 z-50 bg-white sm:rounded-[32px] flex flex-col items-center justify-center p-8 transition-opacity duration-500 ease-out select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Central Animated Brand & Logo */}
      <div className="flex flex-col items-center text-center">
        {/* Animated Emblem */}
        <div className="relative mb-5">
          {/* Subtle soft ambient glow behind the icon */}
          <div
            className={`absolute -inset-3 rounded-3xl bg-slate-100/70 transition-all duration-1000 ease-out ${
              mounted ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
            }`}
          />

          {/* Icon Badge */}
          <div
            className={`relative w-24 h-24 rounded-3xl bg-slate-900 shadow-xl flex items-center justify-center transform transition-all duration-700 ease-out ${
              mounted ? 'scale-100 opacity-100 translate-y-0 rotate-0' : 'scale-50 opacity-0 translate-y-6 -rotate-6'
            }`}
          >
            <Sprout className="w-12 h-12 text-white" strokeWidth={2.2} />
          </div>
        </div>

        {/* App Title */}
        <h1
          className={`text-3xl font-extrabold text-slate-900 tracking-tight transition-all duration-700 delay-150 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          FasalDost
        </h1>

        {/* Tagline */}
        <p
          className={`text-xs font-semibold text-slate-400 mt-1.5 tracking-wider transition-all duration-700 delay-300 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Guardian of Your Harvest
        </p>
      </div>
    </div>
  );
};
