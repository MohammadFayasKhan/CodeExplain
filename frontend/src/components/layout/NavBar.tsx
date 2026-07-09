/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Header navigation bar containing branding, routes, and layout selectors.
 *
 * Top navigation bar. Contains the wordmark, a Home affordance (only shown
 * off-home), the History button (only shown on home), and the About link.
 * All routes are keyboard reachable and use React Router; deep-linking works.
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { History, Sparkles, Info, Home as HomeIcon, ArrowLeft } from 'lucide-react';

interface Props {
  onOpenHistory: () => void;
}

export const NavBar: React.FC<Props> = ({ onOpenHistory }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === '/';

  const isAbout = location.pathname === '/about';

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      {/* Google Stitch-style blended blur navbar background */}
      <div className="absolute inset-0 nav-blur-bg pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-md px-md py-3 md:px-lg md:py-4">
        <div className="flex items-center gap-md min-w-0">
          {!onHome && !isAbout && (
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-pill px-2.5 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06] transition-colors"
              aria-label="Go back"
              data-testid="nav-back-btn"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          {isAbout ? (
            <div className="flex items-center gap-sm text-ink-primary min-w-0" data-testid="nav-wordmark">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-soft shadow-lg shadow-accent/30 shrink-0">
                <Sparkles size={16} className="text-bg-base" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight truncate">
                CodeExplain
              </span>
            </div>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-sm text-ink-primary hover:opacity-90 transition min-w-0"
              data-testid="nav-wordmark"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-soft shadow-lg shadow-accent/30 shrink-0">
                <Sparkles size={16} className="text-bg-base" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight truncate">
                CodeExplain
              </span>
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {isAbout && (
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-pill px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition-colors"
              title="Back to Home"
              data-testid="nav-back-home-arrow"
            >
              <ArrowLeft size={15} />
              <span className="text-[13px] font-medium">Home</span>
            </Link>
          )}
          {!isAbout && (
            <>
              {!onHome && (
                <Link
                  to="/"
                  className="inline-flex items-center gap-sm rounded-pill px-md py-2 text-pill text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition-colors"
                  data-testid="nav-home-link"
                >
                  <HomeIcon size={14} />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              )}
              {onHome && (
                <button
                  onClick={onOpenHistory}
                  className="inline-flex items-center gap-sm rounded-pill px-md py-2 text-pill text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition-colors"
                  data-testid="nav-history-btn"
                >
                  <History size={14} />
                  <span className="hidden sm:inline">History</span>
                </button>
              )}
              <Link
                to="/about"
                className={`inline-flex items-center gap-sm rounded-pill px-md py-2 text-pill transition-colors ${
                  location.pathname === '/about'
                    ? 'text-ink-primary bg-white/[0.06]'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05]'
                }`}
                data-testid="nav-about-link"
              >
                <Info size={14} />
                <span className="hidden sm:inline">About</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
