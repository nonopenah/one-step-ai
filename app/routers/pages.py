"""서버 렌더링 페이지 (Jinja2). 인터랙션은 /api 를 fetch 로 호출."""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from .. import config, content, repo
from ..services import feedback, recommend

router = APIRouter()
templates = Jinja2Templates(directory=str(config.BASE_DIR / "templates"))

NAV = [
    ("home", "/home", "홈"),
    ("practice", "/practice", "AI 상황 연습"),
    ("actions", "/actions", "작은 실천"),
    ("support", "/support", "도움과 연결"),
    ("records", "/records", "나의 기록"),
]


def render(request: Request, name: str, active: str = "", **ctx):
    return templates.TemplateResponse(request, name, {"nav": NAV, "active": active, **ctx})


@router.get("/", response_class=HTMLResponse)
def intro(request: Request):
    if repo.get_user(request.state.uid)["onboarding"]:
        return RedirectResponse("/home")
    return render(request, "intro.html")


@router.get("/onboarding", response_class=HTMLResponse)
def onboarding(request: Request):
    return render(request, "onboarding.html", interests=content.INTERESTS)


@router.get("/home", response_class=HTMLResponse)
def home(request: Request):
    uid = request.state.uid
    sessions = repo.list_sessions(uid, 3)
    for s in sessions:
        s["title"] = content.get_scenario(s["scenario_id"])["title"]
    return render(
        request, "home.html", "home",
        rec_practice=recommend.recommend_practice(uid),
        rec_actions=recommend.recommend_actions(uid, 2),
        recent=sessions,
    )


@router.get("/practice", response_class=HTMLResponse)
def practice_list(request: Request):
    cats = sorted({s["category"] for s in content.SCENARIOS})
    return render(request, "practice_list.html", "practice",
                  scenarios=content.SCENARIOS, categories=cats,
                  rec=recommend.recommend_practice(request.state.uid))


@router.get("/practice/{scenario_id}", response_class=HTMLResponse)
def practice_room(request: Request, scenario_id: str, d: int = 0):
    sc = content.get_scenario(scenario_id)
    if not sc:
        raise HTTPException(404)
    u = repo.get_user(request.state.uid)
    diff = d if d in (1, 2, 3) else recommend.recommend_difficulty((u["onboarding"] or {}).get("burden"))
    return render(request, "practice_room.html", "practice", sc=sc, difficulty=diff,
                  silence_seconds=config.SILENCE_SECONDS, silence_hint=u["silence_hint"])


@router.get("/actions", response_class=HTMLResponse)
def actions_page(request: Request):
    uid = request.state.uid
    return render(request, "actions.html", "actions",
                  recommended=recommend.recommend_actions(uid), all_actions=content.ACTIONS)


@router.get("/support", response_class=HTMLResponse)
def support(request: Request):
    uid = request.state.uid
    fields = sorted({p["field"] for p in content.PROGRAMS})
    return render(request, "support.html", "support",
                  recommended=recommend.recommend_programs(uid), fields=fields,
                  saved_ids=repo.list_saved_programs(uid))


@router.get("/records", response_class=HTMLResponse)
def records(request: Request):
    uid = request.state.uid
    sessions = repo.list_sessions(uid)
    for s in sessions:
        s["title"] = content.get_scenario(s["scenario_id"])["title"]
    logs = repo.list_action_logs(uid)
    for l in logs:
        a = content.get_action(l["action_id"])
        l["title"] = a["title"] if a else l["action_id"]
    return render(request, "records.html", "records", sessions=sessions, logs=logs,
                  changes=feedback.change_summary(sessions))


@router.get("/settings", response_class=HTMLResponse)
def settings(request: Request):
    return render(request, "settings.html", "", user=repo.get_user(request.state.uid))
