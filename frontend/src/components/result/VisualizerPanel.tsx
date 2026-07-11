/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Interactive execution visualizer tracing step-by-step code flows.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Cpu, Layers, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { Card, SectionHeader, Button } from '../shared/ui';
import { api } from '../../lib/api';
import { TestCase, TraceStep } from '../../lib/types';

interface Props {
  code: string;
  language: string;
  testCases?: TestCase[];
  provider?: string;
  model?: string;
}

interface InputVariable {
  name: string;
  defaultValue: string;
}

// Extract variables from test case input string (e.g., "arr = [2, 4, 6, 8], size = 4, target = 5")
function parseInputVariables(inputStr: string): InputVariable[] {
  if (!inputStr.includes('=')) {
    return [{ name: 'input', defaultValue: inputStr }];
  }
  
  const vars: InputVariable[] = [];
  let depth = 0;
  let current = '';
  const parts: string[] = [];
  
  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr[i];
    if (char === '[' || char === '{' || char === '(') depth++;
    if (char === ']' || char === '}' || char === ')') depth--;
    
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx !== -1) {
      const name = part.substring(0, eqIdx).trim();
      const val = part.substring(eqIdx + 1).trim();
      vars.push({ name, defaultValue: val });
    }
  }
  return vars;
}

// Detect if a string is a representation of an array/list (e.g. "[1, 2]" or "{3, 4}")
function isArrayString(val: string): boolean {
  const trimmed = val.trim();
  return (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'));
}

// Extract elements from array string representation
function parseArrayElements(val: string): string[] {
  const trimmed = val.trim();
  const inner = trimmed.substring(1, trimmed.length - 1).trim();
  if (!inner) return [];
  return inner.split(',').map(item => item.trim());
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
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [loadingCustomTrace, setLoadingCustomTrace] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const codeContainerRef = useRef<HTMLDivElement | null>(null);

  // Set initial selected test case if available
  useEffect(() => {
    if (testCases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(testCases[0].id);
    } else if (testCases.length === 0 && !selectedCaseId) {
      setSelectedCaseId('custom');
    }
  }, [testCases, selectedCaseId]);

  // Sync/Parse custom input fields from the first default test case format
  useEffect(() => {
    if (testCases && testCases.length > 0) {
      const parsed = parseInputVariables(testCases[0].input);
      const initialVals: Record<string, string> = {};
      for (const item of parsed) {
        initialVals[item.name] = item.defaultValue;
      }
      setCustomVariables(initialVals);
    } else {
      setCustomVariables({ input: '' });
    }
  }, [testCases]);

  const activeCase = selectedCaseId === 'custom' ? customTrace : testCases.find((c) => c.id === selectedCaseId);
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
    }, 1800 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, currentStepList, playbackSpeed]);

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
    const reconstructedInput = Object.entries(customVariables)
      .map(([name, val]) => name === 'input' ? val : `${name} = ${val}`)
      .join(', ');

    if (!reconstructedInput.trim()) return;
    setLoadingCustomTrace(true);
    setCustomError(null);
    try {
      const res = await api.visualize({
        code,
        language,
        custom_input: reconstructedInput,
        provider,
        model,
      });
      const generatedCase: TestCase = {
        id: 'custom',
        input: reconstructedInput,
        expected_output: res.output,
        steps: res.steps,
      };
      setCustomTrace(generatedCase);
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

  // Helper to render array memory states beautifully
  const renderMemoryVariable = (name: string, val: string) => {
    if (isArrayString(val)) {
      const elements = parseArrayElements(val);
      return (
        <div key={name} className="col-span-2 bg-white/[0.01] border border-border-subtle/80 rounded-xl p-sm space-y-sm">
          <div className="flex items-center gap-xs text-[11px] text-ink-secondary">
            <span className="font-mono font-bold text-accent-soft">{name}[]</span>
            <span className="text-ink-muted">=</span>
            <span className="text-ink-muted">{"{"}</span>
            <span className="font-mono text-ink-primary font-medium">{elements.length} items</span>
            <span className="text-ink-muted">{"}"}</span>
          </div>
          <div className="flex flex-wrap gap-xs pt-0.5">
            {elements.map((el, elIdx) => (
              <span
                key={`${name}-${elIdx}-${el}`}
                className="font-mono text-xs text-accent-soft bg-accent/10 border border-accent/20 rounded px-2 py-0.5 animate-var-flash"
              >
                {el}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
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
    );
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
            setSelectedCaseId('custom');
            setCurrentStepIndex(0);
            setIsPlaying(false);
          }}
          className={`rounded-pill px-md py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
            selectedCaseId === 'custom'
              ? 'bg-accent/20 text-accent-soft border border-accent/30'
              : 'text-ink-secondary hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles size={12} />
          Custom Input
        </button>
      </div>

      {/* Case Header Details / Custom Input Form */}
      {selectedCaseId === 'custom' ? (
        <form onSubmit={handleGenerateCustomTrace} className="flex flex-wrap items-center gap-md bg-white/[0.02] border border-border-subtle rounded-2xl p-md text-xs w-full">
          <div className="flex flex-wrap items-center gap-sm flex-1">
            <span className="text-ink-muted font-medium mr-1">Custom Input:</span>
            {Object.entries(customVariables).map(([name, value]) => (
              <div key={name} className="flex items-center gap-xs">
                {name !== 'input' && (
                  <>
                    <span className="font-mono text-ink-secondary font-bold">{name}</span>
                    <span className="text-ink-muted">=</span>
                  </>
                )}
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setCustomVariables((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }));
                  }}
                  placeholder={name === 'input' ? 'e.g. hello()' : `Value for ${name}`}
                  className="bg-black/40 border border-border-subtle focus:border-accent text-ink-primary placeholder:text-ink-muted/50 rounded-xl px-3 py-1.5 font-mono text-xs outline-none transition-colors w-[130px]"
                  disabled={loadingCustomTrace}
                />
              </div>
            ))}
          </div>
          
          <Button
            type="submit"
            loading={loadingCustomTrace}
            disabled={Object.values(customVariables).some(val => !val.trim())}
            className="px-md py-1.5 text-[11px] h-8 shrink-0"
          >
            Run & Visualize
          </Button>

          {activeCase && (
            <>
              <ArrowRight size={14} className="text-ink-muted shrink-0" />
              <div className="flex items-center gap-xs shrink-0">
                <span className="text-ink-muted">Expected Output:</span>
                <code className="text-accent-soft font-mono bg-white/[0.04] px-2 py-0.5 rounded">{activeCase.expected_output}</code>
              </div>
            </>
          )}
        </form>
      ) : activeCase ? (
        <div className="flex flex-wrap items-center gap-md bg-white/[0.02] border border-border-subtle rounded-2xl p-md text-xs w-full">
          <div className="flex items-center gap-xs">
            <span className="text-ink-muted">Input:</span>
            <code className="text-ink-primary font-mono bg-white/[0.04] px-2 py-0.5 rounded">{activeCase.input}</code>
          </div>
          <ArrowRight size={14} className="text-ink-muted" />
          <div className="flex items-center gap-xs">
            <span className="text-ink-muted">Expected Output:</span>
            <code className="text-accent-soft font-mono bg-white/[0.04] px-2 py-0.5 rounded">{activeCase.expected_output}</code>
          </div>
        </div>
      ) : null}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-stretch">
        {/* Code Viewer Panel */}
        <div className="md:col-span-7 flex flex-col min-w-0">
          <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
            <span className="flex items-center gap-xs">
              <Terminal size={12} />
              Execution View
            </span>
            {activeCase && <span>Step {currentStepIndex + 1} of {currentStepList.length}</span>}
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
                      {Object.entries(currentStep.variables).map(([name, val]) => 
                        renderMemoryVariable(name, val)
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-border-subtle rounded-2xl p-md">
                <p className="text-xs text-ink-muted italic leading-relaxed">
                  {customError || "Enter custom arguments in the input fields above and click 'Run & Visualize' to generate step-by-step trace animations."}
                </p>
              </div>
            )}
          </div>

          {/* Visualizer Player Controller Bar */}
          <div className={`bg-white/[0.02] border border-border-subtle rounded-2xl p-sm flex items-center justify-between gap-sm transition-opacity ${
            !activeCase ? 'opacity-40 pointer-events-none' : ''
          }`}>
            <button
              onClick={handleReset}
              disabled={currentStepIndex === 0 || !activeCase}
              className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
              title="Reset to first step"
            >
              <RotateCcw size={16} />
            </button>

            <div className="flex items-center gap-xs">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0 || !activeCase}
                className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                title="Previous Step"
              >
                <SkipBack size={16} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!activeCase}
                className="p-2.5 rounded-xl bg-accent/20 text-accent-soft hover:bg-accent/30 transition-colors disabled:opacity-40"
                title={isPlaying ? 'Pause' : 'Autoplay'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                onClick={handleNext}
                disabled={currentStepIndex === currentStepList.length - 1 || !activeCase}
                className="p-2 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
                title="Next Step"
              >
                <SkipForward size={16} />
              </button>
            </div>

            <div className="flex items-center gap-xs">
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-white/[0.04] hover:bg-white/[0.08] text-ink-secondary hover:text-ink-primary border border-border-subtle rounded-xl px-2 py-1 text-[11px] outline-none cursor-pointer transition-colors"
                disabled={!activeCase}
                title="Playback Speed"
              >
                <option value="0.5" className="bg-bg-base text-ink-primary">0.5x</option>
                <option value="1.0" className="bg-bg-base text-ink-primary">1.0x</option>
                <option value="1.5" className="bg-bg-base text-ink-primary">1.5x</option>
                <option value="2.0" className="bg-bg-base text-ink-primary">2.0x</option>
              </select>
            </div>

            <div className="text-[11px] text-ink-muted pr-sm">
              {activeCase ? `${Math.round(((currentStepIndex + 1) / currentStepList.length) * 100)}% Done` : '0% Done'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
