"""규칙 기반 피드백. 점수/등급 없이 '실제로 시도한 행동' 중심으로 서술한다."""
from .. import content


def build_feedback(scenario: dict, user_msgs: list[str], hints_used: int) -> dict:
    text = " ".join(user_msgs)
    goals = []
    for g in scenario["goals"]:
        goals.append({"id": g["id"], "label": g["label"], "done": any(k in text for k in g["keywords"])})

    done = [g for g in scenario["goals"] if any(k in text for k in g["keywords"])]
    todo = [g for g in scenario["goals"] if g not in done]

    if not user_msgs:
        summary = "이번에는 대화를 시작하지 않았어요. 괜찮아요. 준비되면 언제든 다시 해볼 수 있어요."
    else:
        summary = f"{len(user_msgs)}번 말을 주고받으며 '{scenario['title']}'을(를) 연습했어요."
        if hints_used:
            summary += f" 도움 기능을 {hints_used}번 활용했어요."

    coaching = {
        "good": [g["done_text"] for g in done],
        "next": [g["next_text"] for g in todo],
        "examples": [g["example"] for g in todo],
    }
    if user_msgs and not done:
        coaching["good"] = ["끝까지 대화에 참여해봤어요"]

    related_action = content.get_action(scenario.get("related_action", ""))
    related_programs = [
        {"id": p["id"], "title": p["title"]}
        for p in content.PROGRAMS
        if p["field"] in scenario.get("related_fields", [])
    ][:2]

    return {
        "summary": summary,
        "goals": goals,
        "coaching": coaching,
        "next": {
            "retry_scenario": scenario["id"],
            "action": {"id": related_action["id"], "title": related_action["title"]} if related_action else None,
            "programs": related_programs,
        },
    }


def change_summary(sessions: list[dict]) -> list[str]:
    """과거의 나와 비교한 변화 문장. sessions: 최신순."""
    msgs = []
    rated = [s for s in sessions if s.get("burden")]
    if len(rated) >= 2:
        first, last = rated[-1]["burden"], rated[0]["burden"]
        if last < first:
            msgs.append(f"처음 연습 때 체감 부담은 {first}점이었는데, 최근에는 {last}점이에요.")
    # 이전에 없던 새로운 행동
    seen: set[str] = set()
    for s in reversed(sessions):  # 오래된 것부터
        fb = s.get("feedback") or {}
        done = {g["label"] for g in fb.get("goals", []) if g["done"]}
        if s is sessions[0]:
            new = done - seen
            if new and seen:
                msgs.append("이번에 새롭게 시도한 행동: " + ", ".join(sorted(new)))
        seen |= done
    return msgs
