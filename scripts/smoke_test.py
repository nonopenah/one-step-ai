"""Local end-to-end smoke test for the FastAPI practice conversation.

Run after starting the backend:
    python scripts/smoke_test.py

Uses an in-memory cookie jar and a disposable anonymous practice session.
"""
import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

ROOT = "http://127.0.0.1:8000"
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def request(path: str, body: dict | None = None):
    payload = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        ROOT + path,
        data=payload,
        headers={"Content-Type": "application/json"} if payload is not None else {},
        method="POST" if payload is not None else "GET",
    )
    with opener.open(req, timeout=10) as response:
        return json.load(response)


def main():
    assert request("/health")["status"] == "ok", "Backend health check failed"
    scenarios = request("/api/scenarios")
    assert any(item["id"] == "store_question" for item in scenarios), "Store scenario missing"
    runtime = request("/api/runtime")
    assert isinstance(runtime["llm_configured"], bool), "Unexpected runtime data"
    print("[1/4] Backend and store scenario: OK")

    started = request("/api/practice/start", {"scenario_id": "store_question", "difficulty": 1, "mode": "text"})
    assert started["ai"] == "", "Store worker spoke before the user"
    session_id = started["session_id"]
    print("[2/4] User-initiated session: OK")

    reply = request(
        f"/api/practice/{session_id}/message",
        {"text": "저기요, 컵라면은 어디에 있나요?", "complexity": "normal", "lead": "normal"},
    )
    assert reply["ai"].strip(), "Empty chatbot reply"
    assert reply["response_mode"] in {"llm", "mock"}, "Unknown AI response mode"
    print(f"[3/4] Practice reply: OK (mode={reply['response_mode']})")

    result = request(f"/api/practice/{session_id}/end", {})
    assert isinstance(result.get("goals"), list), "Feedback goals missing"
    assert result.get("summary"), "Feedback summary missing"
    print("[4/4] Feedback: OK")
    print("PASS: Backend practice flow is working.")
    if reply["response_mode"] == "mock":
        print("NOTE: This response came from rules, not from a generative AI model.")
    print("NOTE: Feedback is currently rule-based, not clinically validated.")


if __name__ == "__main__":
    try:
        main()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"FAIL: Cannot reach backend at {ROOT}. Start backend first. Error: {exc}", file=sys.stderr)
        sys.exit(1)
    except (AssertionError, ValueError, KeyError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
