# 한걸음 프론트엔드 · Soft Neutral UI

기존 FastAPI 서버를 유지하면서 Next.js + TypeScript 기반으로 구현한 UI 프로토타입입니다.

## 실행 방법 (Windows PowerShell)

프로젝트 루트에서 백엔드를 실행합니다.

```powershell
python -X utf8 -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

별도 터미널에서 프론트엔드를 실행합니다.

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 백엔드가 없어도 체험 모드로 화면을 둘러볼 수 있습니다.

## 현재 구현된 주요 화면

- 홈: 연습 및 작은 실천 진입, 시나리오 추천, 선택적 관심 주제
- AI 상황 연습: 카테고리별 목록, 연습 소개, 텍스트 방식, 난이도 3단계
- 대화: 실제 백엔드 요청 / 데모 응답, 힌트, 쉬어가기, 종료 확인
- 결과: 키워드 기반 피드백, 선택적 어려움 체크, 부담 정도 입력, 재연습
- 기록: 현재 열린 화면 세션 안에서 만든 연습 이력과 성장 표현
- 작은 실천·도움과 연결: API 연동 전 시연 화면

## 현재 한계 (중요)

- 백엔드 연결 실패 시 체험 모드로 전환합니다. 체험 응답과 피드백은 AI가 생성한 것이 아닙니다.
- 백엔드가 연결되어 있어도 LLM API 키가 없다면 규칙 기반 대화 응답입니다.
- 현재 연습 종료 피드백은 키워드 기반이며, 심리 상태를 평가하거나 진단하지 않습니다.
- 나의 기록 화면은 UI 시연용 메모리 상태입니다. **새로고침 시 초기화됩니다.** 서버 기록 조회, 사용자 계정 및 저장 정책은 아직 구현되지 않았습니다.
- 홈의 관심 주제 선택은 현재 브라우저 화면에서만 추천을 바꾸며, 상태 체크·AI 개인화와는 다릅니다.
- 음성 연습은 아직 지원하지 않습니다.
- 실제 지원기관 검색·추천·신청은 아직 연결되지 않았습니다.

## 검증

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
```

Playwright 테스트는 백엔드와 프론트엔드를 실행해 홈 → 연습 → 피드백 → 기록의 경로를 검증합니다.
테스트용 Chromium 설치가 필요하면 `npx.cmd playwright install chromium`을 실행하세요.

백엔드 API 단독 점검: 루트에서 `python scripts/smoke_test.py` (백엔드 선실행).
