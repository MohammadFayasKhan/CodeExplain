/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Unified TypeScript types mirroring backend response envelopes.
 *
 * Frontend TypeScript mirror of the backend Pydantic schemas.
 * These types intentionally match `backend/app/models/*.py` field-for-field.
 * If the backend schema changes, this file must be updated in the same
 * commit — the frontend renders against these types directly.
 */

export interface ComplexityAnalysis {
  big_o: string;
  reasoning: string;
}

export interface LineCommentary {
  line_range: string;
  code_snippet: string;
  explanation: string;
}

export type ImprovementCategory =
  | 'naming'
  | 'performance'
  | 'readability'
  | 'structure'
  | 'bug_risk';

export interface Improvement {
  title: string;
  detail: string;
  category: ImprovementCategory;
}

export interface TraceStep {
  line_number: number;
  explanation: string;
  variables: Record<string, string>;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  steps: TraceStep[];
}

export interface ExplanationResponse {
  overview: string;
  plain_english_explanation: string;
  time_complexity: ComplexityAnalysis;
  space_complexity: ComplexityAnalysis;
  line_by_line: LineCommentary[];
  improvements: Improvement[];
  detected_language: string;
  test_cases?: TestCase[]; // Mark optional for backward compatibility
  provider_used: string;
  model_used: string;
}

export type QuestionType = 'multiple_choice' | 'predict_output';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  answer: string;
  provider_used: string;
  model_used: string;
}

export interface ModelOption {
  key: string;
  provider: string;
  model_id: string;
  display_name: string;
}

export interface ModelsListResponse {
  default: string;
  models: ModelOption[];
}

export interface APIError {
  error: { type: string; message: string; detail?: unknown };
}

/** A locally-stored history entry — never sent to the server. */
export interface HistoryEntry {
  id: string;
  created_at: string;
  language: string;
  code_preview: string;   // first ~120 chars for the list
  code: string;
  explanation: ExplanationResponse;
}
