/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Educational loading screen with progress ticks and model status indicators.
 */

import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { Card } from '../shared/ui';

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
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-lg animate-fade-in-up" data-testid="loading-panel">
      {/* Dynamic thinking / status card */}
      <Card className="p-lg space-y-md border border-accent/20 bg-accent/[0.02]">
        <div className="flex items-center gap-md">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent animate-pulse">
            <Brain size={22} className="relative z-10 animate-bounce" style={{ animationDuration: '3s' }} />
            <span className="absolute inset-0 rounded-xl bg-accent/25 blur-sm animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="space-y-xs">
            <h3 className="text-xl font-semibold glow-text-loading tracking-wide">
              Thinking...
            </h3>
            <p className="text-sm text-ink-secondary flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
              {STEPS[stepIdx]}
            </p>
          </div>
        </div>
      </Card>

      {/* Main layout skeleton representation */}
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

        {/* Complexity grid skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
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

        {/* Line by line walkthrough card skeleton */}
        <Card className="p-lg space-y-md">
          <div className="flex items-center gap-sm">
            <div className="h-6 w-6 rounded-md bg-white/[0.04] shimmer" />
            <div className="h-6 w-40 rounded bg-white/[0.04] shimmer" />
          </div>
          <div className="space-y-md pt-sm">
            <div className="rounded-2xl border border-border-subtle bg-white/[0.01] p-md space-y-sm">
              <div className="h-5 w-20 rounded-md bg-white/[0.04] shimmer" />
              <div className="h-[52px] w-full rounded-xl bg-white/[0.02] shimmer" />
              <div className="h-3 w-[90%] rounded bg-white/[0.03] shimmer" />
            </div>
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
