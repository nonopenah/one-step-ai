"""정적 콘텐츠(시나리오/실천/프로그램) 로더. 추후 DB·공공데이터 API로 교체."""
import json
from pathlib import Path

DATA = Path(__file__).parent / "data"
INTERESTS = ["취업·진로", "대인관계", "일상 회복", "교육·역량 개발", "경제·복지", "전문 지원"]


def _load(name: str) -> list[dict]:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


SCENARIOS = _load("scenarios.json")
ACTIONS = _load("actions.json")
PROGRAMS = _load("programs.json")


def _find(items: list[dict], id_: str):
    return next((i for i in items if i["id"] == id_), None)


def get_scenario(id_: str):
    return _find(SCENARIOS, id_)


def get_action(id_: str):
    return _find(ACTIONS, id_)


def get_program(id_: str):
    return _find(PROGRAMS, id_)
