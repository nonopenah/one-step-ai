"""실제 모델 API 연동의 흐름, 실패 처리, 프롬프트 안정성 검증.

외부 API에 비용을 발생시키지 않고 Fake Anthropic 클라이언트를 사용한다.
"""
import sys
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app import config, repo
from app.services import ai
from tests.test_flow import client  # noqa: F401


def _start(client):
    response = client.post("/api/practice/start", json={"scenario_id": "store_question", "difficulty": 1})
    assert response.status_code == 200
    return response.json()["session_id"]


def test_real_provider_request_receives_user_first_and_scenario_prompt(monkeypatch):
    seen = {}

    class FakeClient:
        def __init__(self, **kwargs):
            seen["key"] = kwargs["api_key"]

        @property
        def messages(self):
            return self

        def create(self, **kwargs):
            seen.update(kwargs)
            return SimpleNamespace(content=[SimpleNamespace(type="text", text="안쪽 진열대에 있습니다.")])

    monkeypatch.setitem(sys.modules, "anthropic", SimpleNamespace(Anthropic=FakeClient))
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-api-key")
    monkeypatch.setattr(config, "AI_MODEL", "claude-haiku-5-5")

    from app import content
    scenario = content.get_scenario("store_question")
    text, mode = ai.reply_with_mode(
        scenario,
        [{"role": "user", "content": "실례합니다. 우유는 어디 있어요?"}],
        1,
    )

    assert mode == "llm"
    assert text == "안쪽 진열대에 있습니다."
    assert seen["messages"] == [{"role": "user", "content": "실례합니다. 우유는 어디 있어요?"}]
    assert seen["model"] == "claude-haiku-5-5"
    assert "편의점 직원" in seen["system"]
    assert "난이도 1" in seen["system"]
    assert "연습 잘했어요" in seen["system"]  # 인물의 대사로 사용하지 말라는 규칙


def test_provider_failure_is_not_disguised_as_mock_and_turn_is_not_saved(monkeypatch, client):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-api-key")
    sid = _start(client)

    def fail(*args, **kwargs):
        raise RuntimeError("private upstream details")

    with patch.object(ai, "_llm_reply", side_effect=fail):
        response = client.post(
            f"/api/practice/{sid}/message",
            json={"text": "혹시 컵라면 어디 있어요?"},
        )

    assert response.status_code == 503
    assert "private upstream details" not in response.text
    assert repo.get_messages(sid) == []
    assert "AI 응답" in response.json()["detail"]


def test_provider_success_records_real_turn_and_mode(monkeypatch, client):
    monkeypatch.setattr(config, "ANTHROPIC_API_KEY", "test-api-key")
    sid = _start(client)

    with patch.object(ai, "_llm_reply", return_value="저쪽 선반에 있어요.") as llm_call:
        response = client.post(
            f"/api/practice/{sid}/message",
            json={"text": "컵라면 어디 있어요?"},
        )

    assert response.status_code == 200
    assert response.json() == {"ai": "저쪽 선반에 있어요.", "response_mode": "llm"}
    assert repo.get_messages(sid) == [
        {"role": "user", "content": "컵라면 어디 있어요?"},
        {"role": "ai", "content": "저쪽 선반에 있어요."},
    ]
    assert llm_call.call_args.args[1][-1] == {"role": "user", "content": "컵라면 어디 있어요?"}


def test_model_uses_recent_history_in_alternating_order():
    history = [
        {"role": "ai", "content": "안녕하세요."},
        {"role": "user", "content": "제가 물어봐도 될까요?"},
        {"role": "user", "content": "우유 어디에 있나요?"},
    ]
    messages = ai._messages_for_model(history)
    assert [m["role"] for m in messages] == ["user", "assistant", "user"]
    assert "우유" in messages[-1]["content"]
