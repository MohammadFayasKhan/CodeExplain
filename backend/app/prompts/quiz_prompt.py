"""Prompt template for the /api/quiz call."""

from __future__ import annotations

from ..models.explanation import ExplanationResponse

SYSTEM_PROMPT = """You are a quiz generator inside CodeExplain, a code \
tutoring app. You will be given a code snippet plus an explanation of it, \
and you must produce 3-5 comprehension questions derived DIRECTLY from that \
specific code.

You MUST respond with a SINGLE valid JSON object matching this schema:

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "predict_output",
      "prompt": "The question text. Must reference actual variable, function or class names from the submitted code.",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A) ...",
      "explanation": "1-3 sentence justification shown to the user AFTER they answer, referencing the specific line(s) of code."
    }
  ]
}

RULES:
1. Generate 3 to 5 questions total.
2. AT LEAST TWO questions must reference specific variable, function, or \
class identifiers from the submitted code. Generic \"what is a for loop\" \
questions are FORBIDDEN.
3. Include AT LEAST ONE predict_output question when the code is \
deterministic and has no external I/O. For predict_output, set options to \
either null OR to 4 plausible outputs. The correct_answer must be an exact \
string.
4. For multiple_choice, provide exactly 4 options, each prefixed with 'A) ', \
'B) ', 'C) ', 'D) '. The correct_answer must exactly match ONE of the \
options character-for-character.
5. VARY the concept coverage across questions. Draw from: debugging, \
tracing/dry-run, optimization, complexity, output prediction, best practices, \
code quality, conceptual understanding, edge cases. Do NOT ask two questions \
about the exact same concept unless the code is trivially small.
6. Vary difficulty: at least one easy (definition-level) and one harder \
(reasoning-level) question.
7. Randomize the position of the correct answer across the four options. Do \
not always put the correct answer at A.
8. If you are told about PREVIOUSLY ASKED questions, you MUST generate \
entirely different questions. Do not repeat, paraphrase, or slightly modify \
any of them. Cover different concepts, different lines of code, or different \
aspects of behavior. If literally no unique questions remain, return an \
empty questions array (i.e. {"questions": []}).
9. Never quiz on trivia unrelated to the snippet (e.g. Python history).
10. Return VALID JSON, no markdown fences, no prose.
"""


def build_user_prompt(
    *,
    code: str,
    language: str,
    explanation: ExplanationResponse,
    previous_questions: list[str] | None = None,
) -> str:
    """Assemble the quiz-generation user prompt.

    Including the previously-generated explanation lets the model craft
    questions that reinforce specific points from the explanation (complexity,
    improvement suggestions), producing a more coherent quiz.

    ``previous_questions`` is a flat list of question prompts already shown
    to the user in this session (across regenerations). We stringify them
    into the prompt so the model can steer clear of duplicates.
    """

    previously_block = ""
    if previous_questions:
        bullet_list = "\n".join(f"- {q}" for q in previous_questions[-30:])
        previously_block = (
            "\n\nPREVIOUSLY ASKED questions (do NOT repeat or paraphrase these):\n"
            f"{bullet_list}\n"
        )

    return (
        f"Language: {language}\n\n"
        f"Code:\n```\n{code}\n```\n\n"
        f"Previous explanation JSON (for context):\n"
        f"{explanation.model_dump_json(indent=2)}"
        f"{previously_block}\n\n"
        "Generate the quiz JSON now."
    )
