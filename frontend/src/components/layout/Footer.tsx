/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Ultra-minimal site-wide footer with branding, author name, and socials.
 */

import React from 'react';
import { Github, Linkedin, Instagram } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="relative mt-3xl border-t border-border-subtle/40 bg-transparent" data-testid="site-footer">
    {/* Google Stitch-style blended blur footer background */}
    <div className="absolute inset-0 footer-blur-bg pointer-events-none" />

    <div className="relative z-10 mx-auto max-w-6xl px-md md:px-lg py-md">
      <div className="flex items-center justify-between gap-md text-[13px] text-ink-muted">
        {/* Left branding & author */}
        <div className="group flex items-center gap-2 select-none">
          {/* Logo container */}
          <div className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-soft shadow-md shrink-0 overflow-hidden">
            <svg
              viewBox="0 0 32 32"
              className="h-4 w-4 text-bg-base fill-none stroke-current"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M 10 10 L 5 16 L 10 22"
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
              <path
                d="M 18 8 L 14 24"
                className="transition-all duration-500 group-hover:rotate-[15deg] origin-center"
              />
              <path
                d="M 22 10 L 27 16 L 22 22"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </svg>
          </div>
          <span className="font-display font-semibold text-ink-primary">CodeExplain</span>
          <span className="text-border-strong text-[10px]">•</span>
          <span className="text-[12.5px] text-ink-muted">
            Crafted by{' '}
            <span className="text-accent-soft font-medium drop-shadow-[0_0_8px_rgba(168,156,255,0.35)] hover:drop-shadow-[0_0_12px_rgba(168,156,255,0.6)] hover:text-white transition-all duration-300">
              Mohammad Fayas Khan
            </span>
          </span>
        </div>

        {/* Right socials */}
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/MohammadFayasKhan"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="GitHub"
            data-testid="footer-github"
          >
            <Github size={15} />
          </a>
          <a
            href="https://www.linkedin.com/in/mohammadfayaskhan"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="LinkedIn"
            data-testid="footer-linkedin"
          >
            <Linkedin size={15} />
          </a>
          <a
            href="https://www.instagram.com/fayaskhanx"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="Instagram"
            data-testid="footer-instagram"
          >
            <Instagram size={15} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);
