"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "chaythraar-opening-seen";

export function OpeningSequence() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let finishTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      try {
        if (window.sessionStorage.getItem(SESSION_KEY)) return;
        window.sessionStorage.setItem(SESSION_KEY, "true");
      } catch {
        // The in-memory animation still works if session storage is unavailable.
      }

      const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setReducedMotion(shouldReduceMotion);
      setVisible(true);
      finishTimer = window.setTimeout(() => setVisible(false), shouldReduceMotion ? 360 : 2450);
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[var(--color-ink)] px-5 text-white" role="region" aria-label="CHAYTHRAAR introduction">
      <div aria-hidden="true" className={reducedMotion ? "text-center" : "text-center intro-sequence-content"}>
        <p className="intro-presenter text-xs font-semibold uppercase tracking-[0.24em] text-white/70 sm:text-sm">The GOTEI <span className="mx-2 text-[var(--color-copper-soft)]">presents</span></p>
        <div className="mx-auto my-6 h-px w-12 bg-[var(--color-copper)] sm:my-8" />
        <h1 className="intro-brand font-editorial text-3xl leading-tight sm:text-5xl">CHAYTHRAAR</h1>
        <p className="intro-support mt-4 text-sm text-white/75 sm:text-base">A digital archive of Chitral&apos;s culture, history, heritage, and local knowledge.</p>
      </div>
      <button type="button" onClick={() => setVisible(false)} className="pointer-events-auto absolute right-4 top-4 inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-copper-soft)] sm:right-8 sm:top-8">Skip intro</button>
    </div>
  );
}