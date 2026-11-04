# 단계적 사회진입 지원 서비스 (프로토타입)

AI 사회상황 연습 → 작은 실천 → 기록 → 현실 지원 프로그램 연결을 하나의 경험으로 묶는 웹 서비스 프로토타입입니다.
기획 문서의 IA(홈 / AI 상황 연습 / 작은 실천 / 도움과 연결 / 나의 기록 / 설정)를 그대로 따릅니다.

## 빠른 시작

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

- 서비스: http://127.0.0.1:8000
- API 문서(Swagger): http://127.0.0.1:8000/docs
- 테스트: `pytest`

## 현재 구현 범위 (프로토타입)

| 영역 | 상태 |
| --- | --- |
| 상태 체크 + 맞춤 첫 연습 추천 (이유 표시, 건너뛰기) | ✅ 규칙 기반 |
| AI 상황 연습 (텍스트) | ✅ Mock AI, LLM 연동 선택 |
| 힌트 → 답변 예시 → 단계별 안내 | ✅ |
| 대화 조절(질문 복잡도/AI 주도), 일시정지, 침묵 시 화면 도움 제안 | ✅ 기본형 |
| 연습 피드백 (점수 없이 행동 중심) + 선택적 부담도 응답 | ✅ 규칙 기반 |
| 작은 실천 (해봤어요/일부/다음에) + 선택 소감 | ✅ |
| 도움과 연결 (추천·필터 검색·관심 저장·AI 문의 연습·공식 페이지 링크) | ✅ **샘플 데이터** |
| 나의 기록 (변화 문장, 개별 삭제) | ✅ |
| 설정 (대화 저장 기본 OFF, 전체 데이터 삭제) | ✅ |
| 음성 대화(STT/TTS) | ⬜ TODO |
| 회원가입/로그인 | ⬜ 익명 쿠키로 대체 (팀 논의 필요) |
| 실제 프로그램 데이터 (온통청년 Open API 등) | ⬜ TODO |

## 구조

```
app/
├── main.py              # FastAPI 앱, 익명 사용자 미들웨어
├── config.py            # 환경변수
├── db.py                # SQLite 스키마
├── repo.py              # DB 접근 함수
├── content.py           # 시나리오/실천/프로그램 로더
├── data/                # scenarios.json / actions.json / programs.json  ← 콘텐츠는 여기서 수정
├── services/
│   ├── ai.py            # 역할극 응답 (Mock ↔ LLM)
│   ├── feedback.py      # 행동 중심 피드백, 변화 요약
│   └── recommend.py     # 추천 규칙 (+추천 이유)
├── routers/
│   ├── api.py           # /api/* JSON API
│   └── pages.py         # 서버 렌더링 페이지
├── templates/           # Jinja2
└── static/              # CSS / JS
tests/test_flow.py
```

## 실제 LLM 연결

`.env.example`을 `.env`로 복사하고 `ANTHROPIC_API_KEY`를 채운 뒤 `pip install anthropic`.
키가 없거나 호출이 실패하면 자동으로 Mock 응답으로 대체됩니다.

## 설계 원칙 반영 (기획서 기준)

- 점수·등급 없음, 시도한 행동 중심 피드백
- 모든 추천에 이유 표시, 질문/추천 모두 건너뛰기 가능
- 전체 대화 텍스트 저장 기본 OFF, 음성 원본 미보관, 개별/전체 삭제 지원
- 침묵 알림은 화면 표시 방식, 3분에 한 번만 노출

## 팀 논의 후 교체할 부분

기획서 10장 항목 중 코드에 임시 값이 들어간 곳:
- 상태 체크 질문/추천 규칙 → `services/recommend.py`
- 시나리오·행동 목표 → `app/data/scenarios.json`
- 침묵 감지 시간 → `.env`의 `SILENCE_SECONDS`
- 인증 → `main.py`의 익명 미들웨어
