"""시나리오 첫 발화·응답 모드·피드백 연결 검증."""

from tests.test_flow import client  # noqa: F401


def test_store_asks_user_to_initiate(client):
    r = client.post("/api/practice/start", json={"scenario_id": "store_question", "difficulty": 1})
    assert r.status_code == 200
    assert r.json()["ai"] == ""
    sid = r.json()["session_id"]
    response = client.post(f"/api/practice/{sid}/message", json={"text": "저기요, 컵라면이 어디 있나요?"})
    assert response.status_code == 200
    assert response.json()["ai"]
    assert response.json()["response_mode"] in {"mock", "llm"}
    fb = client.post(f"/api/practice/{sid}/end", json={}).json()
    assert fb["goals"]


def test_runtime_discloses_llm_configuration_not_api_key(client):
    r = client.get("/api/runtime")
    assert r.status_code == 200
    assert isinstance(r.json()["llm_configured"], bool)
    assert "ANTHROPIC_API_KEY" not in r.json()
