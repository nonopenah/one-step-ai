# 한걸음 프론트엔드 v0.0

현재 FastAPI 백엔드를 유지하면서, Next.js + TypeScript로 만든 프론트엔드 실험용 UI입니다.

## 시작

Node.js 20.9 이상 권장.

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000 에 접속하세요.

### 기존 FastAPI 서버에 연결

프로젝트 루트에서:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Next.js의 `/api/*` 요청은 기본적으로 `http://127.0.0.1:8000/api/*`로 전달됩니다.
다른 백엔드 주소는 `frontend/.env.local`의 `BACKEND_URL`로 설정하세요.

**주의**: 백엔드 접속에 실패하면 체험 모드로 실행됩니다. 이 모드의 대화와 피드백은 **예시 응답**이며 실제 AI 분석이 아닙니다. 기존 FastAPI 역시 `ANTHROPIC_API_KEY`가 없는 경우 규칙 기반 Mock 응답을 사용합니다. 따라서 화면에 '서버 연결'이라고 표시되어도 실제 LLM이 동작한다는 뜻은 아닙니다.

## 설계

- `app/`: Next.js 라우트와 공통 스타일
- `components/PracticeApp.tsx`: 라이브러리 → 소개 → 대화 → 결과 UX
- `lib/api.ts`: 백엔드 API 호출
- `lib/demo.ts`: 백엔드 없는 상태에서 체험하는 예시 대화/결과
- `lib/types.ts`: 백엔드 응답 타입

## 현재 범위

- 반응형 데스크톱/모바일 화면
- 시나리오 목록 및 선택
- 연습 소개 및 난이도 선택
- 실제 백엔드 연동형 텍스트 채팅
- 도움말·잠시 쉬기·중단 확인
- 피드백 및 선택적 체감 부담 기록
- 백엔드 미연결 시 표시가 명확한 데모 모드

## 후속 작업

- 기존 백엔드 시나리오에 사용자-주도 편의점 시나리오 반영
- AI 대화 응답 상태·연습 세션 재시작 시나리오 검증
- 프롬프트 평가와 개인정보 보호 정책 정립
- 실제 사용자 테스트 및 접근성 점검

이 PR은 기존 Python 백엔드 및 HTML 템플릿을 수정하지 않습니다.

## Windows에서 백엔드까지 연결하기

VS Code에서 터미널을 새로 열고, **프로젝트 최상위 폴더**에서 아래 명령을 실행합니다.

```powershell
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload --port 8000
```

그 다음 프론트엔드 터미널(별도 터미널)을 열어 다음을 실행합니다.

```powershell
cd frontend
npm.cmd run dev
```

브라우저에서 `http://localhost:3000` 새로고침 → 화면 상단에 `서버 연결 · 규칙 응답` 등이 표시되면 FastAPI와 연결된 것입니다.

실제 LLM을 사용하려면 `py -m pip install anthropic`으로 추가 설치한 뒤, 루트의 `.env`에 `ANTHROPIC_API_KEY`와 공급자에서 제공하는 실제 모델 ID를 `AI_MODEL`로 설정해야 합니다. 이 파일과 API 키는 GitHub에 올리지 마세요.

백엔드에 LLM을 연결해도 지금의 **연습 종료 피드백은 키워드 기반**입니다. 별도의 평가 프롬프트 설계와 검증이 필요합니다.
