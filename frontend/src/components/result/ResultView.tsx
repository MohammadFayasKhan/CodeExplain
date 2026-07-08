// ==============================================================================
// CodeLearn - Summer Training Internship Project (LPU submission candidate)
// Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
// File: frontend/src/components/result/ResultView.tsx
// Purpose: Renders the structured explanation results card layouts.
// ==============================================================================

/**
 * AI Code Explanation Results Container View.
 * 
 * This component structures and renders the six distinct analysis sections:
 * 1. Overview Statement (Status block header badges and export buttons)
 * 2. Detailed plain-english description walkthrough
 * 3. Time Complexity analytics card
 * 4. Space Complexity analytics card
 * 5. Interactive Big-O chart curve graphic
 * 6. Line-by-line code walk accordion panels
 * 7. Key optimization and improvements cards
 * 
 * Technical Design Explanations for Students:
 * 1. HTML5 Details Accordion: The line-by-line walkthrough uses the native HTML `<details>`
 *    and `<summary>` tags. This provides collapsible accordion menus out-of-the-box
 *    without requiring heavy custom JavaScript/React open/close toggle state logic.
 * 2. Dynamic Key-Value Mapping: We use a record object (`categoryLabel`) to map category identifiers
 *    (like 'bug_risk') to specific tailwind classnames and labels.
 * 3. Responsive Grid systems: Time and Space cards are styled with `grid grid-cols-1 md:grid-cols-2`,
 *    which stacks them vertically on mobile viewports but displays them side-by-side on tablets/desktops.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  Database,
  ListChecks,
  Wand2,
  FileText,
} from 'lucide-react';
import type { ExplanationResponse } from '../../lib/types';
import { Badge, Card, SectionHeader } from '../shared/ui';
import { CodeBlock } from '../shared/CodeBlock';
import { ExportMenu } from './ExportMenu';
import { ComplexityGraph } from './ComplexityGraph';

// Record mapper object linking category keys to customized Tailwind visual badge styles
const categoryLabel: Record<string, { label: string; className: string }> = {
  naming: { label: 'Naming', className: 'bg-amber-500/15 text-amber-200 border-amber-400/30' },
  performance: { label: 'Performance', className: 'bg-sky-500/15 text-sky-200 border-sky-400/30' },
  readability: { label: 'Readability', className: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' },
  structure: { label: 'Structure', className: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30' },
  bug_risk: { label: 'Bug risk', className: 'bg-red-500/15 text-red-200 border-red-400/30' },
};

interface Props {
  explanation: ExplanationResponse; // Schema-validated backend response
  language: string;                  // User-selected editor language
  code: string;                      // Raw user source code string
  onCopied: () => void;              // Clipboard copy callback handler
}

// Framer motion animation configurations with index-based delays
const fadeStagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
});

export const ResultView: React.FC<Props> = ({ explanation, language, code, onCopied }) => {
  return (
    <div className="space-y-lg" data-testid="result-view">
      
      {/* 
        Status Badges and Export Actions Row:
        Displays the AI provider, LLM model key, language info, and exports option menu.
      */}
      <motion.div
        {...fadeStagger(0)}
        className="flex flex-wrap items-center justify-between gap-sm"
      >
        <div className="flex flex-wrap items-center gap-sm">
          <Badge tone="accent" data-testid="badge-provider">
            Provider: {explanation.provider_used}
          </Badge>
          <Badge tone="accent" data-testid="badge-model">
            Model: {explanation.model_used}
          </Badge>
          <Badge tone="category" data-testid="badge-language">
            {explanation.detected_language || language}
          </Badge>
        </div>
        {/* Render PDF/Markdown print options */}
        <ExportMenu
          code={code}
          language={language}
          explanation={explanation}
          onCopied={onCopied}
        />
      </motion.div>

      {/* 1. Overview Card block */}
      <motion.div {...fadeStagger(1)}>
        <Card className="p-lg" data-testid="section-overview">
          <SectionHeader
            eyebrow="Overview"
            title={explanation.overview}
            icon={<FileText size={18} />}
          />
        </Card>
      </motion.div>

      {/* 2. Plain-English Description Card block */}
      <motion.div {...fadeStagger(2)}>
        <Card className="p-lg space-y-md" data-testid="section-explanation">
          <SectionHeader
            eyebrow="Plain English"
            title="What this code does"
            icon={<BookOpen size={18} />}
          />
          {/* whitespace-pre-line preserves paragraph carriage returns automatically */}
          <div className="prose-invert whitespace-pre-line text-ink-secondary leading-relaxed text-[15px]">
            {explanation.plain_english_explanation}
          </div>
        </Card>
      </motion.div>

      {/* 3 & 4. Complexity Cards: Time and Space details (Side-by-side) */}
      <div className="grid gap-lg md:grid-cols-2">
        <motion.div {...fadeStagger(3)}>
          <Card className="p-lg space-y-md h-full" data-testid="section-time-complexity">
            <SectionHeader
              eyebrow="Time complexity"
              title={explanation.time_complexity.big_o}
              icon={<Clock size={18} />}
            />
            <p className="text-ink-secondary text-[14.5px] leading-relaxed">
              {explanation.time_complexity.reasoning}
            </p>
          </Card>
        </motion.div>
        
        <motion.div {...fadeStagger(4)}>
          <Card className="p-lg space-y-md h-full" data-testid="section-space-complexity">
            <SectionHeader
              eyebrow="Space complexity"
              title={explanation.space_complexity.big_o}
              icon={<Database size={18} />}
            />
            <p className="text-ink-secondary text-[14.5px] leading-relaxed">
              {explanation.space_complexity.reasoning}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* 5. Complexity Graph Visualizer (Full-width below complexity cards) */}
      <motion.div {...fadeStagger(4.5)}>
        <ComplexityGraph
          timeComplexity={explanation.time_complexity.big_o}
          spaceComplexity={explanation.space_complexity.big_o}
        />
      </motion.div>

      {/* 6. Line-by-Line Breakdown Walkthrough Section */}
      <motion.div {...fadeStagger(5)}>
        <Card className="p-lg" data-testid="section-line-by-line">
          <SectionHeader
            eyebrow="Line by line"
            title="Walkthrough"
            icon={<ListChecks size={18} />}
          />
          <div className="mt-md space-y-md">
            {/* Loop through each code statement walk record returned by the backend */}
            {explanation.line_by_line.map((line, i) => (
              <details
                key={i}
                // Pre-open the first two accordion rows for a preview hint on load
                open={i < 2}
                className="group rounded-2xl border border-border-subtle bg-white/[0.02] p-md open:bg-white/[0.04] transition-colors"
                data-testid={`line-item-${i}`}
              >
                {/* summary serves as the interactive header bar of the accordion */}
                <summary className="flex cursor-pointer items-center justify-between gap-md list-none">
                  <div className="flex items-center gap-sm">
                    <Badge tone="category">Line {line.line_range}</Badge>
                    {/* Shortened preview of the walkthrough text */}
                    <span className="text-ink-secondary text-sm truncate max-w-[420px]">
                      {line.explanation.slice(0, 90)}
                      {line.explanation.length > 90 ? '…' : ''}
                    </span>
                  </div>
                  {/* Toggle text tags which switch depending on details '.group-open' classes */}
                  <span className="text-ink-muted text-xs group-open:hidden">Expand</span>
                  <span className="text-ink-muted text-xs hidden group-open:inline">Collapse</span>
                </summary>
                
                {/* Expanded Accordion Panel contents */}
                <div className="mt-md space-y-md">
                  {/* Code highlight block displaying the specific lines isolated */}
                  <CodeBlock code={line.code_snippet} language={explanation.detected_language || language} />
                  <p className="text-ink-secondary text-[14.5px] leading-relaxed">
                    {line.explanation}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* 7. Suggested Improvements & Refactoring Section */}
      <motion.div {...fadeStagger(6)}>
        <Card className="p-lg" data-testid="section-improvements">
          <SectionHeader
            eyebrow="Suggested improvements"
            title={`${explanation.improvements.length} ways to make this better`}
            icon={<Wand2 size={18} />}
          />
          <ul className="mt-md space-y-md">
            {/* Loop and map each refactoring record suggestion */}
            {explanation.improvements.map((imp, i) => {
              // Resolve category styling dynamically
              const cat = categoryLabel[imp.category] || { label: imp.category, className: 'bg-white/10 text-ink-secondary border-white/10' };
              return (
                <li
                  key={i}
                  className="rounded-2xl border border-border-subtle bg-white/[0.02] p-md"
                  data-testid={`improvement-item-${i}`}
                >
                  <div className="flex items-start justify-between gap-md">
                    <h4 className="font-display text-[16px] font-semibold text-ink-primary">
                      {imp.title}
                    </h4>
                    {/* Display colored category badge label */}
                    <span className={`text-[10.5px] uppercase tracking-[0.08em] rounded-badge border px-2 py-0.5 shrink-0 ${cat.className}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="mt-2 text-ink-secondary text-[14.5px] leading-relaxed">
                    {imp.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </motion.div>
    </div>
  );
};
