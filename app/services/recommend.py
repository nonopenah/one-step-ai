"""규칙 기반 추천. 모든 추천에는 '이유'를 함께 반환한다 (개인화 투명성)."""
from .. import content, repo

INTEREST_TO_CATEGORY = {
    "취업·진로": "취업·직장",
    "대인관계": "대인관계",
    "일상 회복": "일상",
    "교육·역량 개발": "취업·직장",
    "경제·복지": "도움 요청",
    "전문 지원": "도움 요청",
}


def recommend_difficulty(burden: int | None) -> int:
    # 부담이 클수록 낮은 난이도에서 시작 (사용자가 직접 변경 가능)
    return 1 if (burden or 3) >= 3 else 2


def recommend_practice(uid: str) -> dict:
    ob = repo.get_user(uid)["onboarding"] or {}
    interests = ob.get("interests", [])
    cats = [INTEREST_TO_CATEGORY[i] for i in interests if i in INTEREST_TO_CATEGORY]
    done_ids = {s["scenario_id"] for s in repo.list_sessions(uid)}

    candidates = [s for s in content.SCENARIOS if s["category"] in cats] or content.SCENARIOS
    # 아직 안 해본 것을 우선
    candidates = sorted(candidates, key=lambda s: s["id"] in done_ids)
    pick = candidates[0]
    diff = recommend_difficulty(ob.get("burden"))

    if cats and pick["category"] in cats:
        reason = f"관심 분야로 선택하신 '{interests[cats.index(pick['category'])]}'와 관련된 연습이에요."
    else:
        reason = "가볍게 시작하기 좋은 연습이에요."
    if ob.get("burden") and ob["burden"] >= 3:
        reason += " 부담이 큰 편이라 쉬운 난이도로 시작해요. 언제든 바꿀 수 있어요."
    return {"scenario": pick, "difficulty": diff, "reason": reason}


def recommend_actions(uid: str, limit: int = 3) -> list[dict]:
    ob = repo.get_user(uid)["onboarding"] or {}
    interests = set(ob.get("interests", []))
    sessions = repo.list_sessions(uid)
    practiced = {s["scenario_id"] for s in sessions}
    out = []
    for a in content.ACTIONS:
        reason, score = "", 0
        if a.get("from_scenario") in practiced:
            reason, score = "최근 연습한 상황을 현실에서 시도해볼 수 있어요.", 2
        elif a["category"] in interests:
            reason, score = f"관심 분야('{a['category']}')와 관련된 활동이에요.", 1
        elif a["level"] == 1:
            reason, score = "부담이 적은 첫 활동이에요.", 0
        else:
            continue
        out.append({**a, "reason": reason, "_s": score})
    out.sort(key=lambda a: -a["_s"])
    for a in out:
        a.pop("_s")
    return out[:limit]


def recommend_programs(uid: str, limit: int = 3) -> list[dict]:
    ob = repo.get_user(uid)["onboarding"] or {}
    interests = ob.get("interests", [])
    out = []
    for p in content.PROGRAMS:
        if p["field"] in interests:
            out.append({**p, "reason": f"상태 체크에서 선택하신 '{p['field']}' 분야예요."})
    if len(out) < limit:  # 연습 이력은 보조 정보로만 사용 (관심을 단정하지 않음)
        practiced = {s["scenario_id"] for s in repo.list_sessions(uid)}
        for p in content.PROGRAMS:
            sc = content.get_scenario(p.get("practice", ""))
            if sc and sc["id"] in practiced and all(p["id"] != o["id"] for o in out):
                out.append({**p, "reason": "최근 연습한 상황과 관련 있을 수 있어요. 맞지 않으면 무시하셔도 돼요."})
    return out[:limit]
