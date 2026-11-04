import os
import tempfile

import pytest
from fastapi.testclient import TestClient

os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")

from app.main import app  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_pages_load(client):
    for path in ["/", "/onboarding", "/home", "/practice", "/practice/greeting",
                 "/actions", "/support", "/records", "/settings", "/health"]:
        assert client.get(path).status_code == 200, path


def test_onboarding_and_recommend(client):
    r = client.post("/api/onboarding", json={"burden": 4, "interests": ["취업·진로"], "goal": "면접"})
    assert r.status_code == 200
    body = r.json()
    assert body["scenario"]["category"] == "취업·직장"
    assert body["difficulty"] == 1 and body["reason"]


def test_practice_flow_without_transcript_saved(client):
    sid = client.post("/api/practice/start", json={"scenario_id": "greeting", "difficulty": 2}).json()["session_id"]
    r = client.post(f"/api/practice/{sid}/message", json={"text": "안녕하세요, 저는 처음 왔어요. 어떤 모임이에요?"})
    assert r.json()["ai"]
    assert client.post(f"/api/practice/{sid}/hint?level=2").json()["hint"]
    fb = client.post(f"/api/practice/{sid}/end", json={}).json()
    done = {g["id"] for g in fb["goals"] if g["done"]}
    assert {"g_greet", "g_self", "g_ask"} <= done
    client.post(f"/api/practice/{sid}/reflect", json={"burden": 2})
    rec = client.get("/api/records").json()
    assert len(rec["sessions"]) == 1 and rec["sessions"][0]["burden"] == 2
    # 기본 설정: 대화 원문은 저장되지 않아야 함
    from app import repo
    assert repo.get_messages(sid) == []


def test_action_log_and_delete(client):
    assert client.post("/api/actions/log", json={"action_id": "walk_10", "status": "partial"}).status_code == 200
    logs = client.get("/api/records").json()["actions"]
    assert client.delete(f"/api/records/action/{logs[0]['id']}").status_code == 200


def test_programs_filter_and_save(client):
    assert all(p["field"] == "대인관계" for p in client.get("/api/programs?field=대인관계").json())
    client.post("/api/programs/p1/save")
    assert [p["id"] for p in client.get("/api/programs/saved").json()] == ["p1"]


def test_delete_all_data(client):
    client.post("/api/actions/log", json={"action_id": "walk_10", "status": "done"})
    client.delete("/api/me/data")
    assert client.get("/api/records").json()["actions"] == []
