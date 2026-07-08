// ==============================================================================
// CodeLearn - Summer Training Internship Project (LPU submission candidate)
// Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
// File: frontend/src/components/result/LoadingPanel.tsx
// Purpose: Premium LLM-style loading indicator with shimmering skeletons.
// ==============================================================================

/**
 * Premium Shimmer Loading Panel.
 * 
 * In modern UX/UI design, instead of showing a blank screen or a single circular spinner,
 * it is best practice to show "Skeleton Screens" (layout placeholders that mimic the
 * shape of the actual loaded components) combined with animated text logs.
 * This increases perceived performance and keeps the user engaged.
 * 
 * Technical Design Explanations for Students:
 * 1. Cycle Interval Hooks: We use React's `useEffect` combined with `setInterval` to
 *    periodically update the `stepIdx` state every 1.8 seconds. This cycles through the list
 *    of analytical steps (STEPS) to show the user exactly what phase of analysis the AI is on.
 * 2. Skeleton Skeletons: The grey divs use a custom `.shimmer` class (defined in index.css)
 *    which runs a CSS keyframe sliding gradient background left-to-right, creating a premium
 *    shimmering pulse effect.
 * 3. Event Loop Cleans: The `useEffect` returns `() => clearInterval(timer)` to ensure that
 *    if the user navigates away or the analysis completes, the timer is destroyed immediately.
 */

import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { Card } from '../shared/ui';

// Ordered array of processing steps to simulate real-time AI thinking phases
const STEPS = [
  'Deconstructing code syntax and control flow...',
  'Analyzing structure and patterns...',
  'Determining time complexity (Big O bounds)...',
  'Calculating space complexity requirements...',
  'Identifying code optimizations and potential bug risks...',
  'Drafting line-by-line annotations...',
  'Formulating plain-English summary walkthrough...',
  'Constructing review quiz questions...',
];

export const LoadingPanel: React.FC = () => {
  // Store the active index of the analytical step string array
  const [stepIdx, setStepIdx] = useState(0);

  // Setup the status-cycling loop on mount
  useEffect(() => {
    // Start an interval timer that runs every 1.8 seconds (1800 milliseconds)
    const timer = setInterval(() => {
      // Safely increment index, wrapping around to 0 when reaching length
      setStepIdx((prev) => (prev + 1) % STEPS.length);
    }, 1800);

    // Cleanup: Clear the interval when the component is unmounted or destroyed
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-lg animate-fade-in-up" data-testid="loading-panel">
      
      {/* 
        Thinking Notification Card:
        Features a glowing bouncing brain vector icon and a flashing status dot indicator.
      */}
      <Card className="p-lg space-y-md border border-accent/20 bg-accent/[0.02]">
        <div className="flex items-center gap-md">
          {/* Animated Brain Icon Badge Wrapper */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent animate-pulse">
            <Brain size={22} className="relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
            {/* Pulsing ring background element */}
            <span className="absolute inset-0 rounded-xl bg-accent/25 blur-sm animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="space-y-xs">
            {/* "Thinking..." title with active gradient slide animation */}
            <h3 className="text-xl font-semibold glow-text-loading tracking-wide">
              Thinking...
            </h3>
            {/* Active processing step status logs */}
            <p className="text-sm text-ink-secondary flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              {STEPS[stepIdx]}
            </p>
          </div>
        </div>
      </Card>

      {/* 
        Layout Skeleton Mockups:
        Renders gray shapes that match the visual layout structure of our results view.
      */}
      <div className="space-y-lg">
        {/* Overview skeleton card */}
        <Card className="p-lg space-y-md">
          <div className="flex items-center gap-sm">
            <div className="h-6 w-6 rounded-md bg-white/[0.04] shimmer" />
            <div className="h-6 w-32 rounded bg-white/[0.04] shimmer" />
          </div>
          <div className="space-y-sm">
            <div className="h-4 w-full rounded bg-white/[0.03] shimmer" />
            <div className="h-4 w-[92%] rounded bg-white/[0.03] shimmer" />
            <div className="h-4 w-[85%] rounded bg-white/[0.03] shimmer" />
            <div className="h-4 w-[60%] rounded bg-white/[0.03] shimmer" />
          </div>
        </Card>

        {/* Complexity grid skeleton cards (Side-by-side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {/* Time complexity card mockup */}
          <Card className="p-lg space-y-md">
            <div className="flex items-center gap-sm">
              <div className="h-5 w-5 rounded-md bg-white/[0.04] shimmer" />
              <div className="h-5 w-24 rounded bg-white/[0.04] shimmer" />
            </div>
            <div className="h-7 w-16 rounded bg-white/[0.05] shimmer" />
            <div className="space-y-xs">
              <div className="h-3 w-full rounded bg-white/[0.03] shimmer" />
              <div className="h-3 w-[78%] rounded bg-white/[0.03] shimmer" />
            </div>
          </Card>

          {/* Space complexity card mockup */}
          <Card className="p-lg space-y-md">
            <div className="flex items-center gap-sm">
              <div className="h-5 w-5 rounded-md bg-white/[0.04] shimmer" />
              <div className="h-5 w-24 rounded bg-white/[0.04] shimmer" />
            </div>
            <div className="h-7 w-16 rounded bg-white/[0.05] shimmer" />
            <div className="space-y-xs">
              <div className="h-3 w-full rounded bg-white/[0.03] shimmer" />
              <div className="h-3 w-[82%] rounded bg-white/[0.03] shimmer" />
            </div>
          </Card>
        </div>

        {/* Line-by-line walkthrough card skeleton mockup */}
        <Card className="p-lg space-y-md">
          <div className="flex items-center gap-sm">
            <div className="h-6 w-6 rounded-md bg-white/[0.04] shimmer" />
            <div className="h-6 w-40 rounded bg-white/[0.04] shimmer" />
          </div>
          <div className="space-y-md pt-sm">
            {/* First code walkthrough block placeholder */}
            <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-md space-y-sm">
              <div className="h-5 w-20 rounded-md bg-white/[0.04] shimmer" />
              <div className="h-[52px] w-full rounded-xl bg-white/[0.02] shimmer" />
              <div className="h-3 w-[90%] rounded bg-white/[0.03] shimmer" />
            </div>
            {/* Second code walkthrough block placeholder */}
            <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-md space-y-sm">
              <div className="h-5 w-24 rounded-md bg-white/[0.04] shimmer" />
              <div className="h-[52px] w-full rounded-xl bg-white/[0.02] shimmer" />
              <div className="h-3 w-[85%] rounded bg-white/[0.03] shimmer" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
