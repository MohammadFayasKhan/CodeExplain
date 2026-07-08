/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Site-wide footer with copyrights, social buttons, and legal placeholders.
 *
 * Site-wide footer used on both the landing/home page and the About page.
 */

import React from 'react';
import { Github, Linkedin, Instagram, Shield, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="mt-2xl border-t border-border-subtle bg-bg-base/40 backdrop-blur-sm">
    <div className="mx-auto max-w-6xl px-md md:px-lg py-md md:py-lg">
      <div className="flex flex-col gap-md md:flex-row md:items-start md:justify-between">
        <div className="space-y-xs">
          <div className="font-display text-md font-semibold text-ink-primary">CodeExplain</div>
          <p className="text-[13px] text-ink-muted max-w-md leading-relaxed">
            Built to make programming concepts easier to understand, through
            AI-powered explanations and an exceptional user experience.
          </p>
          <p className="text-[11.5px] text-ink-muted/70 flex items-center gap-1.5 pt-xs">
            <AlertTriangle size={12} className="text-amber-500/80 shrink-0" />
            <span>AI-generated explanations may contain mistakes. Always verify critical code.</span>
          </p>
        </div>
        
        <div className="flex items-center gap-xs md:self-center">
          <a
            href="https://github.com/MohammadFayasKhan"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="GitHub"
            data-testid="footer-github"
          >
            <Github size={16} />
          </a>
          <a
            href="https://www.linkedin.com/in/mohammadfayaskhan"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="LinkedIn"
            data-testid="footer-linkedin"
          >
            <Linkedin size={16} />
          </a>
          <a
            href="https://www.instagram.com/fayaskhanx"
            target="_blank"
            rel="noreferrer"
            className="rounded-full p-2 text-ink-secondary hover:text-ink-primary hover:bg-white/[0.06] transition"
            aria-label="Instagram"
            data-testid="footer-instagram"
          >
            <Instagram size={16} />
          </a>
        </div>
      </div>

      <div className="mt-md border-t border-border-subtle/50 pt-md flex flex-col gap-sm md:flex-row md:items-center md:justify-between text-[11px] text-ink-muted">
        <div>© 2026 CodeExplain · Crafted by Mohammad Fayas Khan</div>
        <div className="flex items-center gap-md">
          <span className="inline-flex items-center gap-1"><Shield size={11} /> Privacy-first, local history</span>
          <span>v1.0.0</span>
          <span>MIT License</span>
        </div>
      </div>
    </div>
  </footer>
);
