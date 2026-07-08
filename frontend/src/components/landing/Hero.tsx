/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Hero landing section explaining the application value proposition and CTAs.
 *
 * Landing hero — the top-of-page marketing / entry surface.
 * Contains the display headline, subtitle, and the atmospheric blob +
 * dot-grid background layer described in Part 5 of the spec.
 */

import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section
      className="relative pt-2xl pb-xl md:pt-3xl md:pb-2xl px-md md:px-lg overflow-hidden"
      data-testid="hero-section"
    >
      {/* Atmospheric background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 dot-grid" />
        <div
          className="blob animate-blob-float"
          style={{
            top: '-160px',
            left: '15%',
            width: '460px',
            height: '460px',
            background: 'radial-gradient(circle, #7c6af7 0%, transparent 60%)',
          }}
        />
        <div
          className="blob animate-blob-float"
          style={{
            top: '80px',
            right: '5%',
            width: '520px',
            height: '520px',
            animationDelay: '4s',
            background: 'radial-gradient(circle, #4b3bd6 0%, transparent 55%)',
            opacity: 0.35,
          }}
        />
        <div
          className="blob"
          style={{
            top: '260px',
            left: '35%',
            width: '640px',
            height: '640px',
            background: 'radial-gradient(circle, rgba(124,106,247,0.35) 0%, transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-pill border border-border-strong bg-white/[0.03] px-3 py-1.5 mb-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
          <span className="text-label uppercase tracking-[0.14em] text-ink-secondary">
            AI Code Tutor · Structured, always
          </span>
        </div>

        <h1
          className="font-display font-medium text-ink-primary leading-[1.05] tracking-[-0.03em] text-[clamp(30px,7.2vw,72px)] md:text-[clamp(38px,7.4vw,80px)]"
          data-testid="hero-headline"
        >
          Understand code{' '}
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-accent via-accent-soft to-white bg-clip-text text-transparent">
            like never before.
          </span>
        </h1>

        <p className="mx-auto mt-lg max-w-2xl text-subtitle text-ink-secondary">
          Paste any snippet. Get a plain-English explanation, line-by-line commentary,
          correct time and space complexity, and an on-demand quiz built from your code,
          all in one clean, structured view.
        </p>
      </div>
    </section>
  );
};
