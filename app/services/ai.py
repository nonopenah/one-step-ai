"""AI 역할극 응답 생성.
- ANTHROPIC_API_KEY가 있으면 LLM 사용, 없으면 규칙 기반 Mock으로 동작.
- LLM 호출 실패 시에도 Mock으로 fallback 하여 연습이 끊기지 않게 한다.
"""
import logging

from .. import config

log = logging.getLogger(__name__)


def opening(scenario: dict) -> str:
    return scenario["opening"]


def _mock_reply(scenario: dict, history: list[dict], difficulty: int, tuning: dict) -> str:
    if scenario["id"] == "store_question":
        utterance = next((m["content"] for m in reversed(history) if m["role"] == "user"), "").replace(" ", "")
        if any(x in utterance for x in ("감사", "고맙", "안녕히", "수고")):
            return "네, 좋은 하루 보내세요."
        if any(x in utterance for x in ("라면", "컵라면")):
            return "라면은 안쪽 오른편 진열대에 있어요."
        if any(x in utterance for x in ("우유", "생수", "음료")):
            return "음료는 입구 쪽 냉장고에 있어요."
        if any(x in utterance for x in ("과자", "초콜릿", "젤리")):
            return "과자는 가운데 진열대에 있어요."
        if any(x in utterance for x in ("어디", "위치", "찾", "있나요", "있어요")):
            return "어떤 물건을 찾으시나요?"
        return "네, 무슨 일이세요."

    user_turns = sum(1 for m in history if m["role"] == "user")
    script = scenario["script"]
    line = script[min(user_turns - 1, len(script) - 1)]
    probes = scenario.get("probes", [])
    # 난이도 2: 한 턴 걸러, 3: 매 턴 추가 질문 / AI 주도 '낮음'이면 추가 질문 생략
    want_probe = (difficulty == 2 and user_turns % 2 == 0) or difficulty >= 3
    if tuning.get("lead") == "low":
        want_probe = False
    if want_probe and probes and user_turns < len(script):
        line += " " + probes[(user_turns - 1) % len(probes)]
    if tuning.get("complexity") == "simple":
        line = line.split(". ")[0]
    return line


def _llm_reply(scenario: dict, history: list[dict], difficulty: int, tuning: dict) -> str:
    import anthropic  # 선택 의존성

    system = (
        f"당신은 사회상황 연습을 돕는 역할극 상대입니다. 역할: {scenario['ai_role']}. "
        f"상황: {scenario['description']}. 난이도: {difficulty}/3 (높을수록 질문이 더 복잡). "
        f"시나리오 규칙: {scenario.get('role_instructions', '')}. "
        "규칙: 한국어로 1~2문장만 말한다. 사용자를 평가·비난하지 않는다. "
        "사용자가 막히면 압박하지 말고 쉬운 질문으로 바꾼다. 역할극 밖의 조언은 하지 않는다. "
        f"질문 복잡도: {tuning.get('complexity', 'normal')}, AI 주도 정도: {tuning.get('lead', 'normal')}."
    )
    msgs = []
    for m in history:
        statement = m["content"].strip()
        if not statement:
            continue
        role = "user" if m["role"] == "user" else "assistant"
        if not msgs and role == "assistant":
            msgs.append({"role": "user", "content": "(역할극 시작)"})
        if msgs and msgs[-1]["role"] == role:
            msgs[-1]["content"] += "\n" + statement
        else:
            msgs.append({"role": role, "content": statement})
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    r = client.messages.create(model=config.AI_MODEL, max_tokens=300, system=system, messages=msgs)
    return r.content[0].text.strip()


def reply_with_mode(scenario: dict, history: list[dict], difficulty: int, tuning: dict | None = None) -> tuple[str, str]:
    """생성 응답과 실제 사용된 모델 방식(LLM 또는 규칙 기반)을 함께 반환합니다."""
    tuning = tuning or {}
    if config.ANTHROPIC_API_KEY:
        try:
            return _llm_reply(scenario, history, difficulty, tuning), "llm"
        except Exception:  # noqa: BLE001
            log.exception("LLM 호출 실패 - Mock으로 대체")
    return _mock_reply(scenario, history, difficulty, tuning), "mock"


def reply(scenario: dict, history: list[dict], difficulty: int, tuning: dict | None = None) -> str:
    return reply_with_mode(scenario, history, difficulty, tuning)[0]


def hint(scenario: dict, level: int) -> str:
    """단계별 도움: 1 힌트 → 2 답변 예시 → 3 단계별 안내"""
    if level <= 1:
        return scenario["hints"][0]
    if level == 2:
        return "이렇게 말해볼 수 있어요: " + scenario["examples"][0]
    return " / ".join(scenario["steps"])
