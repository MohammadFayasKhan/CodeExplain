/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Results dashboard containing structural code analysis cards.
 *
 * The result view — all six required sections stacked as separated cards.
 * Renders exactly what the backend returned; never invents anything.
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
import { VisualizerPanel } from './VisualizerPanel';

const categoryLabel: Record<string, { label: string; className: string }> = {
  naming: { label: 'Naming', className: 'bg-amber-500/15 text-amber-200 border-amber-400/30' },
  performance: { label: 'Performance', className: 'bg-sky-500/15 text-sky-200 border-sky-400/30' },
  readability: { label: 'Readability', className: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30' },
  structure: { label: 'Structure', className: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30' },
  bug_risk: { label: 'Bug risk', className: 'bg-red-500/15 text-red-200 border-red-400/30' },
};

interface Props {
  explanation: ExplanationResponse;
  language: string;
  code: string;
  onCopied: () => void;
}

const fadeStagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
});

export const ResultView: React.FC<Props> = ({ explanation, language, code, onCopied }) => {
  return (
    <div className="space-y-lg" data-testid="result-view">
      {/* Status Badge row -------------------------------------------------- */}
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
        <ExportMenu
          code={code}
          language={language}
          explanation={explanation}
          onCopied={onCopied}
        />
      </motion.div>

      {/* Overview ---------------------------------------------------------- */}
      <motion.div {...fadeStagger(1)}>
        <Card className="p-lg" data-testid="section-overview">
          <SectionHeader
            eyebrow="Overview"
            title={explanation.overview}
            icon={<FileText size={18} />}
          />
        </Card>
      </motion.div>

      {/* Plain-English Explanation ---------------------------------------- */}
      <motion.div {...fadeStagger(2)}>
        <Card className="p-lg space-y-md" data-testid="section-explanation">
          <SectionHeader
            eyebrow="Plain English"
            title="What this code does"
            icon={<BookOpen size={18} />}
          />
          <div className="prose-invert whitespace-pre-line text-ink-secondary leading-relaxed text-[15px]">
            {explanation.plain_english_explanation}
          </div>
        </Card>
      </motion.div>

      {/* Complexity: Time and Space cards side by side ----- */}
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

      {/* Complexity Curves: full width below details */}
      <motion.div {...fadeStagger(4.5)}>
        <ComplexityGraph
          timeComplexity={explanation.time_complexity.big_o}
          spaceComplexity={explanation.space_complexity.big_o}
        />
      </motion.div>

      {/* Visualizer Panel: step-by-step interactive debugger visualizer */}
      <motion.div {...fadeStagger(4.8)}>
        <VisualizerPanel
          code={code}
          language={language}
          testCases={explanation.test_cases}
          provider={explanation.provider_used}
          model={explanation.model_used}
        />
      </motion.div>

      {/* Line-by-Line ----------------------------------------------------- */}
      <motion.div {...fadeStagger(5)}>
        <Card className="p-lg" data-testid="section-line-by-line">
          <SectionHeader
            eyebrow="Line by line"
            title="Walkthrough"
            icon={<ListChecks size={18} />}
          />
          <div className="mt-md space-y-md">
            {explanation.line_by_line.map((line, i) => (
              <details
                key={i}
                open={true}
                className="group rounded-2xl border border-border-subtle bg-white/[0.02] p-md open:bg-white/[0.04] transition-colors"
                data-testid={`line-item-${i}`}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-md list-none select-none">
                  <div className="flex items-center gap-sm min-w-0 flex-1">
                    <Badge tone="category" className="shrink-0">Line {line.line_range}</Badge>
                    <span className="text-ink-secondary text-sm truncate min-w-0">
                      {line.explanation}
                    </span>
                  </div>
                  <span className="text-ink-muted text-xs group-open:hidden shrink-0 ml-2">Expand</span>
                  <span className="text-ink-muted text-xs hidden group-open:inline shrink-0 ml-2">Collapse</span>
                </summary>
                <div className="mt-md space-y-md">
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

      {/* Improvements ----------------------------------------------------- */}
      <motion.div {...fadeStagger(6)}>
        <Card className="p-lg" data-testid="section-improvements">
          <SectionHeader
            eyebrow="Suggested improvements"
            title={`${explanation.improvements.length} ways to make this better`}
            icon={<Wand2 size={18} />}
          />
          <ul className="mt-md space-y-md">
            {explanation.improvements.map((imp, i) => {
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
