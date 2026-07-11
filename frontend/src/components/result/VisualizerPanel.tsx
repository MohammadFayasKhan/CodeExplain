/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Interactive execution visualizer tracing step-by-step code flows.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Cpu, Layers, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { Card, SectionHeader, Button, Badge } from '../shared/ui';
import { api } from '../../lib/api';
import { TestCase, TraceStep } from '../../lib/types';

interface Props {
  code: string;
  language: string;
  testCases?: TestCase[];
  provider?: string;
  model?: string;
}

export const VisualizerPanel: React.FC<Props> = ({
  code,
  language,
  testCases = [],
  provider,
  model,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [customTrace, setCustomTrace] = useState<TestCase | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const [customInputVal, setCustomInputVal] = useState<string>('');
  const [loadingCustomTrace, setLoadingCustomTrace] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const codeContainerRef = useRef<HTMLDivElement | null>(null);

  // Combine default test cases and custom trace
  const allCases: TestCase[] = [...testCases];
  if (customTrace) {
    allCases.push(customTrace);
  }

  // Set initial selected test case if available
  useEffect(() => {
    if (testCases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(testCases[0].id);
    } else if (testCases.length === 0 && !selectedCaseId) {
      setSelectedCaseId('custom-form');
    }
  }, [testCases, selectedCaseId]);

  const activeCase = allCases.find((c) => c.id === selectedCaseId);
  const currentStepList = activeCase?.steps || [];
  const currentStep: TraceStep | undefined = currentStepList[currentStepIndex];

  // Autoplay intervals
  useEffect(() => {
    if (!isPlaying || !currentStepList.length) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((idx) => {
        if (idx >= currentStepList.length - 1) {
          setIsPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying, currentStepList]);

  // Smooth scroll to highlight lines
  useEffect(() => {
    if (currentStep && codeContainerRef.current) {
      const targetEl = codeContainerRef.current.querySelector(`#line-no-${currentStep.line_number}`);
      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentStepIndex, selectedCaseId, currentStep]);

  const handleGenerateCustomTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputVal.trim()) return;
    setLoadingCustomTrace(true);
    setCustomError(null);
    try {
      const res = await api.visualize({
        code,
        language,
        custom_input: customInputVal,
        provider,
        model,
      });
      const generatedCase: TestCase = {
        id: 'custom',
        input: customInputVal,
        expected_output: res.output,
        steps: res.steps,
      };
      setCustomTrace(generatedCase);
      setSelectedCaseId('custom');
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (err: any) {
      setCustomError(err?.message || 'Failed to generate custom trace. Please try again.');
    } finally {
      setLoadingCustomTrace(false);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((idx) => Math.max(0, idx - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((idx) => Math.min(currentStepList.length - 1, idx + 1));
  };

  const lines = code.split('\n');

  return (
    <Card className="p-lg space-y-md" data-testid="section-visualizer">
      {/* Dynamic glow CSS keyframe for flashing variable changes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes var-flash {
          0% { background-color: rgba(168, 85, 247, 0.4); transform: scale(1.05); }
          100% { background-color: rgba(255, 255, 255, 0.04); transform: scale(1); }
        }
        .animate-var-flash {
          animation: var-flash 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />

      <SectionHeader
        eyebrow="Interactive Visualizer"
        title="Execution Trace & Test Cases"
        icon={<Cpu size={18} />}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-xs border-b border-border-subtle pb-2">
        {testCases.map((tc, idx) => (
          <button
            key={tc.id}
            onClick={() => {
              setSelectedCaseId(tc.id);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            className={`rounded-pill px-md py-1.5 text-xs font-medium transition-colors ${
              selectedCaseId === tc.id
                ? 'bg-accent/20 text-accent-soft border border-accent/30'
                : 'text-ink-secondary hover:bg-white/[0.04]'
            }`}
          >
            Test Case {idx + 1}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedCaseId(customTrace ? 'custom' : 'custom-form');
            setCurrentStepIndex(0);
            setIsPlaying(false);
          }}
          className={`rounded-pill px-md py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
            selectedCaseId === 'custom' || selectedCaseId === 'custom-form'
              ? 'bg-accent/20 text-accent-soft border border-accent/30'
              : 'text-ink-secondary hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles size={12} />
          {customTrace ? 'Custom Trace' : 'Custom Input'}
        </button>
      </div>

      {/* Case Header Details */}
      {activeCase && (
        <div className="flex flex-wrap items-center gap-md bg-white/[0.02] border border-border-subtle rounded-2xl p-md text-xs">
          <div className="flex items-center gap-xs">
            <span className="text-ink-muted">Input:</span>
            <code className="text-ink-primary font-mono bg-white/[0.04] px-2 py-0.5 rounded">{activeCase.input}</code>
          </div>
          <ArrowRight size={14} className="text-ink-muted" />
          <div className="flex items-center gap-xs">
            <span className="text-ink-muted">Expected Output:</span>
            <code className="text-accent-soft font-mono bg-white/[0.04] px-2 py-0.5 rounded">{activeCase.expected_output}</code>
          </div>
          {selectedCaseId === 'custom' && (
            <button
              onClick={() => {
                setSelectedCaseId('custom-form');
                setIsPlaying(false);
              }}
              className="text-accent-soft hover:underline font-medium ml-auto"
            >
              New Custom Input
            </button>
          )}
        </div>
      )}

      {/* Main Content Layout */}
      {selectedCaseId === 'custom-form' ? (
        <form onSubmit={handleGenerateCustomTrace} className="space-y-md p-md bg-white/[0.01] border border-border-subtle rounded-2xl">
          <div className="space-y-sm">
            <label className="block text-xs font-semibold text-ink-secondary">
              Enter Custom Input (e.g. function arguments)
            </label>
            <input
              type="text"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              placeholder="e.g. n = 12 or nums = [3, 2, 4], target = 6"
              className="w-full bg-black/40 border border-border-subtle focus:border-accent text-ink-primary placeholder:text-ink-muted/50 rounded-xl px-md py-3 text-sm transition-colors font-mono"
              disabled={loadingCustomTrace}
            />
          </div>
          {customError && (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-md py-sm rounded-xl">
              {customError}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loadingCustomTrace}
              disabled={!customInputVal.trim()}
              className="px-md py-2 text-xs"
            >
              Generate Trace Steps
            </Button>
          </div>
        </form>
      ) : activeCase ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-stretch">
          {/* Code Viewer Panel */}
          <div className="md:col-span-7 flex flex-col min-w-0">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
              <span className="flex items-center gap-xs">
                <Terminal size={12} />
                Execution View
              </span>
              <span>Step {currentStepIndex + 1} of {currentStepList.length}</span>
            </div>

            <div
              ref={codeContainerRef}
              className="font-mono text-xs overflow-x-auto bg-black/40 rounded-2xl p-md border border-border-subtle leading-relaxed max-h-[360px] overflow-y-auto select-none relative"
            >
              {lines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const isActive = currentStep && lineNum === currentStep.line_number;
                return (
                  <div
                    key={idx}
                    id={`line-no-${lineNum}`}
                    className={`flex items-start transition-colors duration-200 ${
                      isActive
                        ? 'bg-accent/15 border-l-4 border-accent -ml-2 pl-1.5 py-0.5 text-ink-primary font-semibold'
                        : 'text-ink-secondary/70'
                    }`}
                  >
                    <span
                      className={`w-8 select-none text-right pr-sm shrink-0 font-medium ${
                        isActive ? 'text-accent-soft font-bold' : 'text-ink-muted/30'
                      }`}
                    >
                      {lineNum}
                    </span>
                    <code className="whitespace-pre">{lineText || ' '}</code>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variables and Explanation Panel */}
          <div className="md:col-span-5 flex flex-col justify-between min-w-0 space-y-md">
            {/* Step Trace Details */}
            <div className="flex-1 space-y-sm">
              <span className="flex items-center gap-xs text-xs text-ink-muted">
                <Layers size={12} />
                Variables & Step Commentary
              </span>
              
              {currentStep ? (
                <div className="space-y-md">
                  {/* Explanation card */}
                  <div className="bg-white/[0.02] border border-border-subtle rounded-2xl p-md">
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {currentStep.explanation}
                    </p>
                  </div>

                  {/* Variables Grid */}
                  <div className="space-y-xs">
                    <span className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase">
                      Memory State
                    </span>
                    {Object.keys(currentStep.variables).length === 0 ? (
                      <div className="text-xs text-ink-muted italic p-2">
                        No active variables in memory.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-xs">
                        {Object.entries(currentStep.variables).map(([name, val]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between bg-white/[0.01] border border-border-subtle/80 rounded-xl px-sm py-2"
                          >
                            <span className="font-mono text-[11px] text-ink-secondary truncate pr-1" title={name}>
                              {name}
                            </span>
                            <span
                              key={`${name}-${val}`}
                              className="font-mono text-[11px] text-accent-soft bg-white/[0.04] px-1.5 py-0.5 rounded-lg animate-var-flash max-w-[100px] truncate"
                              title={val}
                            >
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-ink-muted italic">
                  Loading steps...
                </div>
              )}
            </div>

            {/* Visualizer Player Controller Bar */}
            <div className="bg-white/[0.02] border border-border-subtle rounded-2xl p-sm flex items-center justify-between gap-sm">
              <button
                onClick={handleReset}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                title="Reset to first step"
              >
                <RotateCcw size={16} />
              </button>

              <div className="flex items-center gap-xs">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                  title="Previous Step"
                >
                  <SkipBack size={16} />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-xl bg-accent/20 text-accent-soft hover:bg-accent/30 transition-colors"
                  title={isPlaying ? 'Pause' : 'Autoplay'}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentStepIndex === currentStepList.length - 1}
                  className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                  title="Next Step"
                >
                  <SkipForward size={16} />
                </button>
              </div>

              <div className="text-[11px] text-ink-muted pr-sm">
                {Math.round(((currentStepIndex + 1) / currentStepList.length) * 100)}% Done
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-ink-muted italic p-md text-center bg-white/[0.01] border border-border-subtle rounded-2xl">
          No test cases available.
        </div>
      )}
    </Card>
  );
};
