// ==============================================================================
// CodeLearn - Summer Training Internship Project (LPU submission candidate)
// Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
// File: frontend/src/components/result/ComplexityGraph.tsx
// Purpose: Interactive SVG Big-O complexity curves visualizer chart.
// ==============================================================================

/**
 * Interactive SVG Big-O Complexity Graph Component.
 * 
 * In algorithm analysis, Big-O notation is used to classify algorithms according to
 * how their run time or space requirements grow as the input size (n) grows.
 * 
 * Technical Design Explanations for Students:
 * 1. SVG Vector Drawing: Instead of using massive external charting libraries (like Chart.js),
 *    we draw mathematical curves directly using standard SVG `<path>` and `<line>` elements,
 *    minimizing application bundle weight and matching the UI design perfectly.
 * 2. Bezier Curves (C / S Path Commands): Curves are drawn using cubic Bezier points:
 *    `M startX,startY C control1X,control1Y control2X,control2Y endX,endY`
 * 3. Bounding-Box SVG Filters: We use SVG `<filter>` layers to add glow effects. Setting
 *    `filterUnits="userSpaceOnUse"` prevents the filters from disappearing on straight horizontal
 *    lines (like O(1)), where the coordinate height resolves to 0.
 * 4. State Binding: Hovering over curve paths or legend items stores the active curve in the
 *    `hoveredCurve` React state, prompting the chart to highlight that line in real-time.
 */

import React, { useState } from 'react';
import { LineChart, Activity, Info } from 'lucide-react';
import { Card, SectionHeader } from '../shared/ui';

// Define the interface props for our component
interface Props {
  timeComplexity: string;  // e.g. "O(N)"
  spaceComplexity: string; // e.g. "O(1)"
}

// Define the schema structure of a curve record
interface CurveDef {
  key: string;        // Big-O label key (O(1), O(n), etc.)
  label: string;      // Human-readable title
  path: string;       // SVG path instructions
  endX: number;       // End coordinate X (for placing label and indicator dot)
  endY: number;       // End coordinate Y
  desc: string;       // Detailed description
}

// Static definition of standard Big-O mathematical complexity curves mapped to SVG layout space.
// The SVG coordinate grid is defined as: Width = 400px, Height = 200px.
// Origin (0,0) is top-left. Bottom-left coordinate is (40, 170) which is our axes intersection.
const curves: CurveDef[] = [
  {
    key: 'O(1)',
    label: 'O(1) - Constant',
    path: 'M 40,170 L 340,170', // Straight horizontal line (y: 170)
    endX: 340,
    endY: 170,
    desc: 'Operations remain constant regardless of input size. Ideal scalability.',
  },
  {
    key: 'O(log n)',
    label: 'O(log n) - Logarithmic',
    path: 'M 40,170 C 120,158 240,147 340,145', // Gentle curve rising slowly
    endX: 340,
    endY: 145,
    desc: 'Execution time grows logarithmically (e.g. binary search). Highly efficient.',
  },
  {
    key: 'O(sqrt n)',
    label: 'O(sqrt n) - Square Root',
    path: 'M 40,170 C 100,150 220,133 340,125',
    endX: 340,
    endY: 125,
    desc: 'Grows proportional to square root of input size (e.g. primality test loop).',
  },
  {
    key: 'O(n)',
    label: 'O(n) - Linear',
    path: 'M 40,170 L 300,50', // Straight diagonal line rising linearly
    endX: 300,
    endY: 50,
    desc: 'Time grows directly proportional to input size (e.g. simple array loops).',
  },
  {
    key: 'O(n log n)',
    label: 'O(n log n) - Linearithmic',
    path: 'M 40,170 C 160,150 240,90 270,30',
    endX: 270,
    endY: 30,
    desc: 'Typical for efficient sorting algorithms like Merge Sort or Quick Sort.',
  },
  {
    key: 'O(n²)',
    label: 'O(n²) - Quadratic',
    path: 'M 40,170 C 100,165 160,110 180,30', // Fast upward curve
    endX: 180,
    endY: 30,
    desc: 'Grows quadratically (e.g. nested loops). Scales poorly for large inputs.',
  },
  {
    key: 'O(2ⁿ)',
    label: 'O(2ⁿ) - Exponential',
    path: 'M 40,170 C 60,165 100,100 110,30', // Extremely steep upward line
    endX: 110,
    endY: 30,
    desc: 'Doubles with each addition to input (e.g. naive recursive Fibonacci). Highly inefficient.',
  },
];

/**
 * Normalizes user-facing string inputs from the LLM to fit our graph keys.
 * Removes spaces, converts to lowercase, and does basic substring matching.
 */
const normalizeComplexity = (s: string): string => {
  const clean = s.toLowerCase().replace(/\s+/g, '');
  if (clean.includes('o(1)')) return 'O(1)';
  if (clean.includes('o(logn)')) return 'O(log n)';
  if (clean.includes('o(sqrt(n))') || clean.includes('o(sqrtn)')) return 'O(sqrt n)';
  if (clean.includes('o(nlogn)')) return 'O(n log n)';
  if (clean.includes('o(n^2)') || clean.includes('o(n2)') || clean.includes('o(n²)') || clean.includes('o(quadratic)')) return 'O(n²)';
  if (clean.includes('o(2^n)') || clean.includes('o(2n)') || clean.includes('o(2ⁿ)') || clean.includes('o(exponential)')) return 'O(2ⁿ)';
  if (clean.includes('o(n)') || clean.includes('o(linear)')) return 'O(n)';
  return '';
};

export const ComplexityGraph: React.FC<Props> = ({ timeComplexity, spaceComplexity }) => {
  // Normalize the incoming string props
  const normTime = normalizeComplexity(timeComplexity);
  const normSpace = normalizeComplexity(spaceComplexity);

  // Set up hover states to store the currently highlighted curve
  const [hoveredCurve, setHoveredCurve] = useState<CurveDef | null>(null);

  return (
    <Card className="p-lg" data-testid="complexity-graph-card">
      {/* Component Header with eyebrow labels and LineChart icon */}
      <SectionHeader
        eyebrow="Complexity Curves"
        title="Big-O Complexity Chart"
        icon={<LineChart className="text-accent-soft" size={18} />}
      />

      <div className="mt-md w-full max-w-[640px] mx-auto flex flex-col gap-md">
        
        {/* Core SVG Graph Container Box */}
        <div className="relative w-full bg-[#15161b]/60 rounded-xl border border-border-subtle/50 p-2.5 overflow-hidden">
          
          {/* 
            SVG Elements:
            - viewBox: Defines coordinate space width="400" height="200".
            - h-auto / w-full: Scales vector coordinates to match container bounds responsively.
          */}
          <svg
            viewBox="0 0 400 200"
            className="w-full h-auto overflow-visible select-none"
            aria-label="Big-O complexity graph"
          >
            <defs>
              {/* 
                Glow Filter for Active Curves:
                - Gaussian blur: Diffuses vector lighting to create a glow.
                - Merge Node: Renders original solid line over the blur shadow.
              */}
              <filter id="glow-time" x="0" y="0" width="400" height="200" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-space" x="0" y="0" width="400" height="200" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Dotted Grid Coordinate Reference Lines */}
            <line x1="40" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
            <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
            <line x1="200" y1="30" x2="200" y2="170" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />

            {/* Solid X and Y Axis boundaries */}
            <line x1="40" y1="170" x2="390" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

            {/* Arrowheads drawn at endpoints of X/Y axes */}
            <polygon points="390,167 396,170 390,173" fill="rgba(255,255,255,0.3)" />
            <polygon points="37,20 40,14 43,20" fill="rgba(255,255,255,0.3)" />

            {/* Axis Title Labels */}
            {/* Centered along x-axis (x = 215) below baseline */}
            <text x="215" y="188" fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="middle">
              n (Size)
            </text>
            {/* Rotated 90deg counter-clockwise to run vertically along y-axis */}
            <text transform="rotate(-90 28 95)" x="28" y="95" fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="middle" letterSpacing="0.5">
              Operations
            </text>

            {/* Map and plot complexity curve paths */}
            {curves.map((c) => {
              const isTime = c.key === normTime;
              const isSpace = c.key === normSpace;
              const isHovered = hoveredCurve?.key === c.key;

              // Determine visual styling states (purple for time, emerald for space, fallback transparent)
              let strokeColor = 'rgba(255, 255, 255, 0.08)';
              let strokeWidth = 1.5;
              let filterId = undefined;

              if (isTime && isSpace) {
                strokeColor = '#a89cff';
                strokeWidth = 3;
                filterId = 'url(#glow-time)';
              } else if (isTime) {
                strokeColor = '#7c6af7'; // Purple Accent
                strokeWidth = 3;
                filterId = 'url(#glow-time)';
              } else if (isSpace) {
                strokeColor = '#10b981'; // Emerald Accent
                strokeWidth = 3;
                filterId = 'url(#glow-space)';
              } else if (isHovered) {
                strokeColor = 'rgba(255, 255, 255, 0.5)';
                strokeWidth = 2.5;
              }

              return (
                <g
                  key={c.key}
                  onMouseEnter={() => setHoveredCurve(c)}
                  onMouseLeave={() => setHoveredCurve(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible thick path overlay (strokeWidth="12") to make hover trigger areas easy to hit */}
                  <path
                    d={c.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                  />
                  {/* Visual path line drawn according to coordinates */}
                  <path
                    d={c.path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter={filterId}
                    className="transition-all duration-300 ease-out"
                  />
                  {/* Endpoint label at curve edge */}
                  <text
                    x={c.endX + 6}
                    y={c.endY + 3}
                    fill={isTime ? '#a89cff' : isSpace ? '#10b981' : isHovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}
                    fontSize={isTime || isSpace || isHovered ? '9.5' : '8'}
                    fontWeight={isTime || isSpace || isHovered ? 'semibold' : 'normal'}
                    className="transition-all duration-300"
                  >
                    {c.key}
                  </text>
                </g>
              );
            })}

            {/* Pulsing indicator dots showing coordinates of active curve limits */}
            {curves.map((c) => {
              const isTime = c.key === normTime;
              const isSpace = c.key === normSpace;

              if (isTime && isSpace) {
                return (
                  <g key={`dots-${c.key}`}>
                    {/* Pulsing indicator ring using Tailwind's animate-ping */}
                    <circle cx={c.endX} cy={c.endY} r="6" fill="#a89cff" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${c.endX}px ${c.endY}px` }} />
                    {/* Core solid endpoint circle */}
                    <circle cx={c.endX} cy={c.endY} r="3.5" fill="#a89cff" />
                  </g>
                );
              }
              if (isTime) {
                return (
                  <g key={`dots-${c.key}`}>
                    <circle cx={c.endX} cy={c.endY} r="6" fill="#7c6af7" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${c.endX}px ${c.endY}px` }} />
                    <circle cx={c.endX} cy={c.endY} r="3.5" fill="#7c6af7" />
                  </g>
                );
              }
              if (isSpace) {
                return (
                  <g key={`dots-${c.key}`}>
                    <circle cx={c.endX} cy={c.endY} r="6" fill="#10b981" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${c.endX}px ${c.endY}px` }} />
                    <circle cx={c.endX} cy={c.endY} r="3.5" fill="#10b981" />
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>

        {/* Legend row buttons corresponding to curves */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {curves.map((c) => {
            const isTime = c.key === normTime;
            const isSpace = c.key === normSpace;
            const isHovered = hoveredCurve?.key === c.key;
            return (
              <button
                key={c.key}
                onMouseEnter={() => setHoveredCurve(c)}
                onMouseLeave={() => setHoveredCurve(null)}
                className={`text-[10px] md:text-[11px] px-2.5 py-0.5 rounded-md border transition-all duration-200 ${
                  isTime && isSpace
                    ? 'bg-[#a89cff]/10 border-[#a89cff]/30 text-[#a89cff] font-semibold'
                    : isTime
                    ? 'bg-[#7c6af7]/10 border-[#7c6af7]/30 text-[#7c6af7] font-semibold'
                    : isSpace
                    ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981] font-semibold'
                    : isHovered
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/[0.02] border-border-subtle/40 text-ink-muted hover:text-ink-secondary hover:bg-white/[0.05]'
                }`}
              >
                {c.key}
              </button>
            );
          })}
        </div>

        {/* Info Card Description or active code complexity data details */}
        <div className="min-h-[58px] bg-white/[0.02] border border-border-subtle/50 rounded-xl px-3 py-2 text-[12.5px] leading-relaxed flex items-start gap-2 text-ink-secondary">
          {hoveredCurve ? (
            <>
              <Info size={14} className="text-accent-soft shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink-primary mr-1">{hoveredCurve.label}:</span>
                {hoveredCurve.desc}
              </div>
            </>
          ) : (
            <>
              <Activity size={14} className="text-accent-soft shrink-0 mt-0.5" />
              <div>
                <p>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#7c6af7] mr-1.5" />
                  Time Complexity: <strong className="text-ink-primary">{timeComplexity}</strong>
                  {normTime && <span className="text-ink-muted"> ({normTime} curve highlighted)</span>}
                </p>
                <p className="mt-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#10b981] mr-1.5" />
                  Space Complexity: <strong className="text-ink-primary">{spaceComplexity}</strong>
                  {normSpace && <span className="text-ink-muted"> ({normSpace} curve highlighted)</span>}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
