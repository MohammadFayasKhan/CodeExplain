/**
 * Minimal shared UI primitives styled directly from the Stitch tokens.
 * We keep these tiny on purpose — a full component library would be
 * over-engineering for the seven-or-so component patterns we actually use.
 */

import React from 'react';

// -----------------------------------------------------------------------
// Button — the pill-shaped CTA. Two variants (primary/secondary) + a
// disabled loading state that keeps the pill shape (per the spec).
// -----------------------------------------------------------------------
type BtnVariant = 'primary' | 'secondary' | 'ghost';

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    loading?: boolean;
  }
> = ({ variant = 'primary', loading, className = '', children, ...rest }) => {
  const base =
    'inline-flex items-center justify-center gap-sm rounded-pill font-medium transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed select-none';
  const sizes = 'px-lg py-3 text-pill';
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-cta text-bg-base hover:bg-white/90 active:bg-white/80',
    secondary: 'bg-surface-pill text-ink-primary hover:bg-surface-hover',
    ghost: 'bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04]',
  };
  return (
    <button
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
};

// -----------------------------------------------------------------------
// Card — a rounded surface used for every result section.
// -----------------------------------------------------------------------
export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { as?: keyof JSX.IntrinsicElements }
> = ({ className = '', children, ...rest }) => (
  <div
    className={`bg-surface-card border border-border-subtle rounded-card ${className}`}
    {...rest}
  >
    {children}
  </div>
);

// -----------------------------------------------------------------------
// Badge — small status pill (e.g. "Model: llama-3.3-70b", "python").
// -----------------------------------------------------------------------
export const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { tone?: 'default' | 'accent' | 'category' }
> = ({ tone = 'default', className = '', children, ...rest }) => {
  const tones = {
    default: 'bg-white/[0.06] text-ink-secondary',
    accent: 'bg-accent/20 text-accent-soft border border-accent/30',
    category: 'bg-surface-pill text-ink-secondary',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-badge px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
};

// -----------------------------------------------------------------------
// Pill — used for language/model dropdown triggers.
// -----------------------------------------------------------------------
export const Pill: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <button
    type="button"
    className={`inline-flex items-center gap-sm bg-surface-pill hover:bg-surface-hover text-ink-primary rounded-pill px-md py-2 text-pill transition-colors duration-200 ${className}`}
    {...rest}
  >
    {children}
  </button>
);

// -----------------------------------------------------------------------
// SectionHeader — icon + label used at the top of each result card.
// -----------------------------------------------------------------------
export const SectionHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
}> = ({ icon, title, eyebrow, right }) => (
  <div className="flex items-center justify-between gap-md">
    <div className="flex items-center gap-sm">
      {icon && <span className="text-accent-soft">{icon}</span>}
      <div>
        {eyebrow && (
          <div className="text-label uppercase text-ink-muted tracking-[0.12em]">
            {eyebrow}
          </div>
        )}
        <h3 className="font-display text-xl font-semibold text-ink-primary">
          {title}
        </h3>
      </div>
    </div>
    {right}
  </div>
);
