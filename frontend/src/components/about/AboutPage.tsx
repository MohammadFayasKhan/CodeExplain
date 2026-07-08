// ==============================================================================
// CodeLearn - Summer Training Internship Project (LPU submission candidate)
// Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
// File: frontend/src/components/about/AboutPage.tsx
// Purpose: Story/Creator page with details on application design and features.
// ==============================================================================

/**
 * About and Creator Profile Page.
 * 
 * In standard modern web applications, the About page serves to explain the project
 * context, feature offerings, and user benefits, as well as details about the creator.
 * 
 * React Concepts Taught:
 * 1. Functional Components (FC): Declared using arrow syntax and typed with `React.FC`.
 * 2. Navigation Hooks: We import `useNavigate` from `react-router-dom` to trigger route redirection.
 * 3. Key Listeners: We mount a keyboard event listener to listen for the 'Escape' key,
 *    providing an intuitive accessibility flow to return home.
 * 4. Micro-Animations: We configure Framer Motion animation objects to slide and fade components.
 * 5. Memory Cleanup: When mounting listeners inside `useEffect`, we return a cleanup callback
 *    function to remove the listener on unmount, preventing memory leaks.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Code2, Clock, Bug, Wand2, MessageCircle,
  Download, Globe2, Palette, Database, Shield, HeartHandshake,
  Github, Linkedin, Instagram,
} from 'lucide-react';
import { Card } from '../shared/ui';

// Array mapping out key benefits. We store these as data structures to loop over
// and render dynamically, reducing duplicate HTML code (DRY - Don't Repeat Yourself principle).
const benefits = [
  { icon: <Sparkles size={18} />, title: 'Plain-English explanations', text: 'Beginner-friendly walkthroughs of any snippet.' },
  { icon: <Code2 size={18} />,    title: 'Line-by-line walkthroughs', text: 'Every meaningful statement gets its own comment.' },
  { icon: <Clock size={18} />,    title: 'Time and space complexity', text: 'Correct, code-specific Big-O with reasoning.' },
  { icon: <Bug size={18} />,      title: 'Bug and code-smell detection', text: 'Flagged as part of Suggested Improvements.' },
  { icon: <Wand2 size={18} />,    title: 'Best-practice suggestions', text: 'Actionable, grounded in your identifiers.' },
  { icon: <MessageCircle size={18} />, title: 'AI follow-up Q and A', text: 'Ask more, in context, about the same code.' },
  { icon: <Download size={18} />, title: 'Markdown and PDF export', text: 'Save any analysis for later or share it.' },
  { icon: <Globe2 size={18} />,   title: 'Multi-language support', text: 'Python and JavaScript first-class; more supported.' },
  { icon: <Palette size={18} />,  title: 'Modern responsive UI',  text: 'Design-system-accurate on every screen size.' },
  { icon: <Database size={18} />, title: 'Persistent local history', text: 'Your past analyses, saved on your device.' },
  { icon: <Shield size={18} />,   title: 'Privacy-first design',   text: 'History never leaves your browser.' },
  { icon: <HeartHandshake size={18} />, title: 'Built with care', text: 'Small feature set, executed properly.' },
];

// Helper configuration generator for Framer Motion stagger animations.
// It accepts an index 'i' to stagger the slide entry time of grids/lists,
// creating a premium, sequential entry animation effect.
const fadeStagger = (i: number) => ({
  initial: { opacity: 0, y: 12 }, // Starts slightly lower (y: 12) and transparent
  whileInView: { opacity: 1, y: 0 }, // Slides up to default position and becomes fully opaque
  viewport: { once: true, margin: '-40px' }, // Trigger only once when entering view
  transition: { duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] as const }, // Premium cubic-bezier easing curve
});

export const AboutPage: React.FC = () => {
  // Navigate hook instantiation
  const navigate = useNavigate();

  // The 'useEffect' hook executes side effects (such as DOM event bindings).
  // Passing '[navigate]' as dependency array ensures this effect triggers once on mount.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // If user taps the 'Escape' key, redirect back to the home view
      if (e.key === 'Escape') navigate('/');
    };
    
    // Attach the event listener to the global window object
    window.addEventListener('keydown', handler);

    // CRITICAL: Cleanup function. React runs this function when the component unmounts
    // to discard the event listener, preventing memory accumulation.
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  return (
    <div className="relative overflow-hidden" data-testid="about-page">
      {/* Background container layout holding radial blobs and dot grid patterns */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[550px]">
        <div className="absolute inset-0 dot-grid" />
        {/* Glowing atmospheric purple blobs using radial gradients */}
        <div className="blob animate-blob-float"
          style={{ top: '-140px', left: '10%', width: '380px', height: '380px',
            background: 'radial-gradient(circle, #7c6af7 0%, transparent 60%)' }} />
        <div className="blob"
          style={{ top: '60px', right: '10%', width: '420px', height: '420px', opacity: 0.35,
            background: 'radial-gradient(circle, #4b3bd6 0%, transparent 55%)' }} />
      </div>

      {/* Subtle ESC keyboard hint at the top */}
      <div className="relative z-10 mx-auto max-w-6xl px-md md:px-lg pt-md">
        <div className="text-[12px] text-ink-muted opacity-70">
          Press <kbd className="rounded border border-border-strong bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-sans mx-1">Esc</kbd> to return Home
        </div>
      </div>

      {/* Main Title Section */}
      <section className="relative z-10 pt-lg pb-lg md:pt-xl px-md md:px-lg">
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.h1
            {...fadeStagger(0)}
            className="font-display font-medium text-ink-primary leading-[1.05] tracking-[-0.03em] text-[clamp(34px,6vw,64px)]"
          >
            About <span className="bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">CodeExplain</span>
          </motion.h1>
          <motion.p {...fadeStagger(1)} className="mx-auto mt-md max-w-2xl text-subtitle text-ink-secondary">
            CodeExplain was built to bridge the gap between reading code and truly
            understanding it, turning every snippet into a structured, teachable artifact.
          </motion.p>
        </div>
      </section>

      {/* Project Story Column Blocks */}
      <section className="mx-auto max-w-4xl px-md md:px-lg py-lg">
        <div className="grid gap-lg md:grid-cols-2">
          {/* Problem Card */}
          <motion.div {...fadeStagger(0)}>
            <Card className="p-lg h-full">
              <h2 className="font-display text-xl font-semibold text-ink-primary">The problem</h2>
              <p className="mt-md text-ink-secondary leading-relaxed text-[15px]">
                Many beginners struggle to understand existing source code because most AI tools
                simply explain what the code does without teaching <em>why</em> it works.
                Documentation is uneven, tutorials skip lines, and large codebases feel opaque.
              </p>
            </Card>
          </motion.div>
          {/* Motivation Card */}
          <motion.div {...fadeStagger(1)}>
            <Card className="p-lg h-full">
              <h2 className="font-display text-xl font-semibold text-ink-primary">Why I built this</h2>
              <p className="mt-md text-ink-secondary leading-relaxed text-[15px]">
                As a computer-science student, I often found that understanding <em>existing</em>{' '}
                code was harder than writing new code. CodeExplain combines AI-powered
                explanations with a clean, structured UI so the learning curve gets shorter and
                your programming intuition gets sharper.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Grid displaying the list of benefits */}
      <section className="mx-auto max-w-6xl px-md md:px-lg py-lg">
        <div className="mb-lg">
          <div className="text-label uppercase tracking-[0.12em] text-ink-muted">Key benefits</div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink-primary">
            Everything a code learner actually needs
          </h2>
        </div>
        <div className="grid gap-md grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div key={b.title} {...fadeStagger(i)}>
              <Card className="p-md h-full hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-sm text-accent-soft">
                  {b.icon}
                  <div className="font-display font-semibold text-ink-primary">{b.title}</div>
                </div>
                <p className="mt-sm text-[13.5px] text-ink-secondary leading-relaxed">{b.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Safety and privacy disclaimer section */}
      <section className="mx-auto max-w-4xl px-md md:px-lg py-lg">
        <Card className="p-lg border-emerald-400/20 bg-emerald-500/[0.03]">
          <div className="flex items-start gap-md">
            <Shield size={20} className="text-emerald-300 mt-1" />
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-primary">
                Privacy note
              </h3>
              <p className="mt-sm text-ink-secondary text-[14.5px] leading-relaxed">
                Your analysis history is stored locally in your browser. Nothing is uploaded or
                saved permanently unless required for AI processing. You remain in control of
                your data and can clear everything at any time from the History drawer.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Creator Profile Badge Section */}
      <section className="mx-auto max-w-4xl px-md md:px-lg pt-lg pb-2xl">
        <Card className="p-lg md:p-xl">
          <div className="flex flex-col gap-lg md:flex-row md:items-center">
            {/* Creator Monogram initials */}
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-accent to-accent-soft shadow-lg shadow-accent/30 shrink-0">
              <span className="font-display text-3xl font-bold text-bg-base">MF</span>
            </div>
            <div className="flex-1">
              <div className="text-label uppercase tracking-[0.12em] text-ink-muted">Creator</div>
              <h3 className="font-display text-2xl font-semibold text-ink-primary">
                Mohammad Fayas Khan
              </h3>
              <p className="mt-1 text-ink-secondary">
                Computer Science Engineering student, AI and Full-Stack Developer
              </p>
              {/* Creator Social / Profile Links */}
              <div className="mt-md flex flex-wrap items-center gap-sm">
                <a
                  href="https://github.com/MohammadFayasKhan"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-sm rounded-pill border border-border-strong px-md py-2 text-sm text-ink-primary hover:bg-white/[0.05] transition"
                  data-testid="about-github-link"
                >
                  <Github size={14} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/mohammadfayaskhan"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-sm rounded-pill border border-border-strong px-md py-2 text-sm text-ink-primary hover:bg-white/[0.05] transition"
                  data-testid="about-linkedin-link"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
                <a
                  href="https://www.instagram.com/fayaskhanx"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-sm rounded-pill border border-border-strong px-md py-2 text-sm text-ink-primary hover:bg-white/[0.05] transition"
                  data-testid="about-instagram-link"
                >
                  <Instagram size={14} /> Instagram
                </a>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
