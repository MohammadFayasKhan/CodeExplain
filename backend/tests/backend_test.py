"""Backend tests for CodeExplain API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://03dbdd87-8e29-42e6-aa17-dcf4a93c354f.preview.emergentagent.com").rstrip("/")
TIMEOUT = 90

PY_TWOSUM = """def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []
"""

PY_FIB = """def fib(n):
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)
"""

PY_STACK = """class Stack:
    def __init__(self):
        self.items = []
    def push(self, x):
        self.items.append(x)
    def pop(self):
        return self.items.pop() if self.items else None
"""

JS_REDUCE = """const arr = [1,2,3,4];
const sum = arr.reduce((a,b) => a + b, 0);
console.log(sum);
"""

JS_DEBOUNCE = """function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
"""

JS_LOOP = """function findMax(arr) {
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}
"""


# ---------- health & models ----------
def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert "provider_reachable" in d
    assert "groq" in d["provider_reachable"] and "gemini" in d["provider_reachable"]
    assert isinstance(d["available_models"], list) and len(d["available_models"]) >= 4


def test_models():
    r = requests.get(f"{BASE_URL}/api/models", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert "default" in d
    assert isinstance(d["models"], list)
    keys = {m["key"] for m in d["models"]}
    assert "groq:llama-3.3-70b-versatile" in keys
    assert "gemini:gemini-2.5-flash" in keys
    assert len(keys) == 4
    for m in d["models"]:
        assert set(["key", "provider", "model_id", "display_name"]).issubset(m.keys())


# ---------- explain validation errors ----------
def test_explain_empty_code():
    r = requests.post(f"{BASE_URL}/api/explain", json={"code": "   ", "language": "python"}, timeout=30)
    assert r.status_code == 422
    d = r.json()
    assert "error" in d
    assert "message" in d["error"] and "type" in d["error"]


def test_explain_missing_code():
    r = requests.post(f"{BASE_URL}/api/explain", json={}, timeout=30)
    assert r.status_code == 422
    d = r.json()
    assert "error" in d


# ---------- explanation schema helper ----------
def _validate_explanation(d, expected_language=None):
    for k in ["overview", "plain_english_explanation", "time_complexity", "space_complexity",
              "line_by_line", "improvements", "detected_language", "provider_used", "model_used"]:
        assert k in d, f"missing {k}"
    assert isinstance(d["overview"], str) and d["overview"].strip()
    assert isinstance(d["plain_english_explanation"], str) and d["plain_english_explanation"].strip()
    for cx in ("time_complexity", "space_complexity"):
        assert "big_o" in d[cx] and "reasoning" in d[cx]
        assert isinstance(d[cx]["big_o"], str) and d[cx]["big_o"].strip()
    assert isinstance(d["line_by_line"], list) and len(d["line_by_line"]) > 0
    for item in d["line_by_line"]:
        assert "line_range" in item and "code_snippet" in item and "explanation" in item
    assert isinstance(d["improvements"], list)
    for imp in d["improvements"]:
        assert "title" in imp and "detail" in imp and "category" in imp
    if expected_language:
        assert expected_language.lower() in d["detected_language"].lower()


# ---------- explain endpoint (Python twosum, default provider) ----------
_explain_cache = {}

def test_explain_python_twosum():
    r = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    _validate_explanation(d, expected_language="python")
    # Complexity check - O(n) time & O(n) space
    assert "n" in d["time_complexity"]["big_o"].lower()
    assert "n" in d["space_complexity"]["big_o"].lower()
    _explain_cache["twosum"] = d


def test_explain_javascript_reduce():
    r = requests.post(f"{BASE_URL}/api/explain", json={"code": JS_REDUCE, "language": "javascript"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    _validate_explanation(d, expected_language="javascript")
    # complexity should be O(n) time, O(1) space
    assert "n" in d["time_complexity"]["big_o"].lower()


def test_explain_with_gemini_provider():
    payload = {"code": PY_TWOSUM, "language": "python", "provider": "gemini", "model": "gemini-2.5-flash"}
    r = requests.post(f"{BASE_URL}/api/explain", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    _validate_explanation(d, expected_language="python")
    assert d["provider_used"] == "gemini"
    assert d["model_used"] == "gemini-2.5-flash"


# ---------- structural consistency across snippets ----------
@pytest.mark.parametrize("code,lang", [
    (PY_FIB, "python"),
    (PY_STACK, "python"),
    (JS_DEBOUNCE, "javascript"),
    (JS_LOOP, "javascript"),
])
def test_explain_structural_consistency(code, lang):
    r = requests.post(f"{BASE_URL}/api/explain", json={"code": code, "language": lang}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    _validate_explanation(r.json(), expected_language=lang)


# ---------- quiz ----------
def test_quiz_from_explanation():
    exp = _explain_cache.get("twosum")
    if not exp:
        r0 = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
        assert r0.status_code == 200
        exp = r0.json()
        _explain_cache["twosum"] = exp

    payload = {"code": PY_TWOSUM, "language": "python", "explanation": exp}
    r = requests.post(f"{BASE_URL}/api/quiz", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "questions" in d
    qs = d["questions"]
    assert 3 <= len(qs) <= 5
    ref_count = 0
    for q in qs:
        assert "id" in q and "type" in q and "prompt" in q
        assert q["type"] in ("multiple_choice", "predict_output")
        assert "correct_answer" in q and "explanation" in q
        if q["type"] == "multiple_choice":
            assert isinstance(q.get("options"), list) and len(q["options"]) >= 2
        # loose reference check
        text = (q["prompt"] + " " + str(q.get("correct_answer", ""))).lower()
        if any(name in text for name in ["two_sum", "seen", "target", "nums", "enumerate"]):
            ref_count += 1
    assert ref_count >= 2, f"Only {ref_count} questions reference code names"


# ---------- chat ----------
# ---------- quiz regeneration uniqueness ----------
def test_quiz_previous_questions_field_accepted():
    """Schema must accept previous_questions (no 422)."""
    exp = _explain_cache.get("twosum")
    if not exp:
        r0 = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
        exp = r0.json()
        _explain_cache["twosum"] = exp
    payload = {
        "code": PY_TWOSUM,
        "language": "python",
        "explanation": exp,
        "previous_questions": ["What does the function return when target is not found?"],
    }
    r = requests.post(f"{BASE_URL}/api/quiz", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "questions" in d


def _norm(s: str) -> str:
    return " ".join(s.lower().strip().split())


def test_quiz_regeneration_produces_different_questions():
    """Second /api/quiz call with previous prompts must yield disjoint prompts."""
    exp = _explain_cache.get("twosum")
    if not exp:
        r0 = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
        exp = r0.json()
        _explain_cache["twosum"] = exp

    payload1 = {"code": PY_TWOSUM, "language": "python", "explanation": exp}
    r1 = requests.post(f"{BASE_URL}/api/quiz", json=payload1, timeout=TIMEOUT)
    assert r1.status_code == 200, r1.text
    q1 = r1.json()["questions"]
    prompts1 = [_norm(q["prompt"]) for q in q1]
    assert len(prompts1) >= 3

    payload2 = {
        "code": PY_TWOSUM,
        "language": "python",
        "explanation": exp,
        "previous_questions": [q["prompt"] for q in q1],
    }
    r2 = requests.post(f"{BASE_URL}/api/quiz", json=payload2, timeout=TIMEOUT)
    assert r2.status_code == 200, r2.text
    q2 = r2.json()["questions"]
    # Empty is a valid "exhausted" state.
    if len(q2) == 0:
        return
    prompts2 = [_norm(q["prompt"]) for q in q2]
    overlap = set(prompts1) & set(prompts2)
    assert not overlap, f"Regenerated quiz contains repeated prompts: {overlap}"


# ---------- explain latency under normal load (indirectly validates 5s cap) ----------
def test_explain_returns_within_reasonable_time():
    import time
    t0 = time.time()
    r = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
    elapsed = time.time() - t0
    assert r.status_code == 200
    # If Retry-After cap was not honoured, this could take thousands of seconds.
    assert elapsed < 90, f"Explain took {elapsed:.1f}s (>90s) — retry cap may not be enforced"


# ---------- chat ----------
def test_chat_followup():
    exp = _explain_cache.get("twosum")
    if not exp:
        r0 = requests.post(f"{BASE_URL}/api/explain", json={"code": PY_TWOSUM, "language": "python"}, timeout=TIMEOUT)
        exp = r0.json()

    payload = {
        "code": PY_TWOSUM,
        "language": "python",
        "explanation": exp,
        "question": "Why do we use a dictionary here?",
        "history": [],
    }
    r = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "answer" in d and isinstance(d["answer"], str) and d["answer"].strip()
    assert "provider_used" in d and "model_used" in d
