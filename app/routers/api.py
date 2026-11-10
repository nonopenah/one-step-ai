"""JSON API (/api). 프론트엔드와 추후 앱/다른 클라이언트가 공통으로 사용."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .. import config, content, repo
from ..services import ai, feedback, recommend

router = APIRouter(prefix="/api")


def uid_dep(request: Request) -> str:
    return request.state.uid


# ---------- schemas ----------
class OnboardingIn(BaseModel):
    burden: int = Field(3, ge=1, le=5)
    interests: list[str] = []
    goal: Optional[str] = Field(None, max_length=200)


class StartIn(BaseModel):
    scenario_id: str
    difficulty: int = Field(1, ge=1, le=3)
    mode: str = "text"


class MessageIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    complexity: Optional[str] = None  # simple | normal
    lead: Optional[str] = None  # low | normal | high


class EndIn(BaseModel):
    burden: Optional[int] = Field(None, ge=1, le=5)
    difficult: list[str] = []


class ActionLogIn(BaseModel):
    action_id: str
    status: str = Field(..., pattern="^(done|partial|later)$")
    note: Optional[str] = Field(None, max_length=500)


class SettingsIn(BaseModel):
    save_transcript: bool
    silence_hint: bool


def _own_session(uid: str, sid: int) -> dict:
    s = repo.get_session(uid, sid)
    if not s:
        raise HTTPException(404, "세션을 찾을 수 없어요.")
    return s


# ---------- onboarding / recommend ----------
@router.post("/onboarding")
def onboarding(body: OnboardingIn, uid: str = Depends(uid_dep)):
    repo.save_onboarding(uid, body.model_dump())
    return recommend.recommend_practice(uid)


@router.get("/recommend/practice")
def rec_practice(uid: str = Depends(uid_dep)):
    return recommend.recommend_practice(uid)


# ---------- practice ----------
@router.get("/runtime")
def runtime_status():
    """설정 여부만 표시합니다. 모델 호출 성공 여부는 각 응답으로 구별합니다."""
    return {"llm_configured": bool(config.ANTHROPIC_API_KEY)}


@router.get("/scenarios")
def scenarios():
    return content.SCENARIOS


@router.post("/practice/start")
def practice_start(body: StartIn, uid: str = Depends(uid_dep)):
    sc = content.get_scenario(body.scenario_id)
    if not sc:
        raise HTTPException(404, "상황을 찾을 수 없어요.")
    sid = repo.create_session(uid, sc["id"], body.difficulty, body.mode)
    first = ai.opening(sc)
    if first:
        repo.add_message(sid, "ai", first)
    return {"session_id": sid, "ai": first}


@router.post("/practice/{sid}/message")
def practice_message(sid: int, body: MessageIn, uid: str = Depends(uid_dep)):
    s = _own_session(uid, sid)
    if s["ended_at"]:
        raise HTTPException(400, "이미 종료된 연습이에요.")
    sc = content.get_scenario(s["scenario_id"])
    # 응답 생성이 성공하기 전에는 메시지를 저장하지 않는다.
    # 실패한 요청이 대화 기록에 남아 재전송 시 중복되는 문제를 방지한다.
    history = [*repo.get_messages(sid), {"role": "user", "content": body.text}]
    try:
        text, response_mode = ai.reply_with_mode(
            sc, history, s["difficulty"], {"complexity": body.complexity, "lead": body.lead}
        )
    except ai.LLMUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    repo.add_message(sid, "user", body.text)
    repo.add_message(sid, "ai", text)
    return {"ai": text, "response_mode": response_mode}


@router.post("/practice/{sid}/hint")
def practice_hint(sid: int, level: int = 1, uid: str = Depends(uid_dep)):
    s = _own_session(uid, sid)
    sc = content.get_scenario(s["scenario_id"])
    repo.inc_hints(sid)
    return {"hint": ai.hint(sc, max(1, min(level, 3)))}


@router.post("/practice/{sid}/end")
def practice_end(sid: int, body: EndIn, uid: str = Depends(uid_dep)):
    s = _own_session(uid, sid)
    if s["ended_at"]:
        return s["feedback"]
    sc = content.get_scenario(s["scenario_id"])
    user_msgs = [m["content"] for m in repo.get_messages(sid) if m["role"] == "user"]
    fb = feedback.build_feedback(sc, user_msgs, s["hints_used"])
    keep = repo.get_user(uid)["save_transcript"]
    repo.end_session(sid, fb, body.burden, body.difficult, keep)
    return fb


@router.post("/practice/{sid}/reflect")
def practice_reflect(sid: int, body: EndIn, uid: str = Depends(uid_dep)):
    """연습 종료 후 선택 응답(체감 부담 등). 건너뛰어도 되는 선택 기능."""
    _own_session(uid, sid)
    repo.set_reflection(sid, body.burden, body.difficult)
    return {"ok": True}


# ---------- small actions ----------
@router.get("/actions")
def actions(uid: str = Depends(uid_dep)):
    return {"recommended": recommend.recommend_actions(uid), "all": content.ACTIONS}


@router.post("/actions/log")
def action_log(body: ActionLogIn, uid: str = Depends(uid_dep)):
    if not content.get_action(body.action_id):
        raise HTTPException(404, "활동을 찾을 수 없어요.")
    return {"id": repo.log_action(uid, body.action_id, body.status, body.note)}


# ---------- support programs ----------
@router.get("/programs")
def programs(field: Optional[str] = None, region: Optional[str] = None, mode: Optional[str] = None,
             q: Optional[str] = None):
    out = content.PROGRAMS
    if field:
        out = [p for p in out if p["field"] == field]
    if region:
        out = [p for p in out if p["region"] in (region, "전국")]
    if mode:
        out = [p for p in out if p["mode"] in (mode, "혼합")]
    if q:
        out = [p for p in out if q in p["title"] or q in p["summary"]]
    return out


@router.get("/programs/recommended")
def programs_recommended(uid: str = Depends(uid_dep)):
    return recommend.recommend_programs(uid)


@router.get("/programs/saved")
def programs_saved(uid: str = Depends(uid_dep)):
    ids = repo.list_saved_programs(uid)
    return [p for p in content.PROGRAMS if p["id"] in ids]


@router.post("/programs/{pid}/save")
def program_save(pid: str, uid: str = Depends(uid_dep)):
    if not content.get_program(pid):
        raise HTTPException(404, "프로그램을 찾을 수 없어요.")
    repo.save_program(uid, pid)
    return {"saved": True}


@router.delete("/programs/{pid}/save")
def program_unsave(pid: str, uid: str = Depends(uid_dep)):
    repo.unsave_program(uid, pid)
    return {"saved": False}


# ---------- records ----------
@router.get("/records")
def records(uid: str = Depends(uid_dep)):
    sessions = repo.list_sessions(uid)
    return {
        "changes": feedback.change_summary(sessions),
        "sessions": sessions,
        "actions": repo.list_action_logs(uid),
    }


@router.delete("/records/practice/{sid}")
def record_delete_practice(sid: int, uid: str = Depends(uid_dep)):
    if not repo.delete_session(uid, sid):
        raise HTTPException(404, "기록을 찾을 수 없어요.")
    return {"deleted": True}


@router.delete("/records/action/{log_id}")
def record_delete_action(log_id: int, uid: str = Depends(uid_dep)):
    if not repo.delete_action_log(uid, log_id):
        raise HTTPException(404, "기록을 찾을 수 없어요.")
    return {"deleted": True}


# ---------- settings ----------
@router.get("/settings")
def get_settings(uid: str = Depends(uid_dep)):
    u = repo.get_user(uid)
    return {"save_transcript": u["save_transcript"], "silence_hint": u["silence_hint"],
            "silence_seconds": config.SILENCE_SECONDS, "onboarding": u["onboarding"]}


@router.put("/settings")
def put_settings(body: SettingsIn, uid: str = Depends(uid_dep)):
    repo.update_settings(uid, body.save_transcript, body.silence_hint)
    return {"ok": True}


@router.delete("/me/data")
def delete_my_data(uid: str = Depends(uid_dep)):
    repo.delete_all(uid)
    return {"deleted": True}
