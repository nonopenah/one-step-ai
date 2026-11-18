"use client";

import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Compass, HeartHandshake, Lightbulb, LoaderCircle, MessageCircle, Pause, Play, RotateCcw, Send, ShieldCheck, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, PracticeFeedback, Scenario } from "@/lib/types";
import { EmptyState, PageTitle } from "./AppShell";

export type Difficulty = 1 | 2 | 3;
const difficultyLabels: Record<Difficulty, string> = {
  1: "편안하게", 2: "조금 더 이어가기", 3: "실제 상황처럼",
};
const difficultyDescriptions: Record<Difficulty, string> = {
  1: "짧고 간단한 대화부터 시작해요.",
  2: "추가 질문을 주고받으며 연습해요.",
  3: "조금 더 자연스럽고 다양한 대화를 연습해요.",
};
export function CategoryIcon({ category, size = 21 }: { category: string; size?: number }) {
  if (category.includes("도움")) return <HeartHandshake size={size} strokeWidth={1.7}/>;
  if (category.includes("취업")) return <BookOpen size={size} strokeWidth={1.7}/>;
  if (category.includes("대인")) return <MessageCircle size={size} strokeWidth={1.7}/>;
  if (category.includes("일상")) return <Store size={size} strokeWidth={1.7}/>;
  return <Compass size={size} strokeWidth={1.7}/>;
}

export function ScenarioLibrary({
  scenarios, onScenario, onBack,
}: { scenarios: Scenario[]; onScenario: (scenario: Scenario) => void; onBack: () => void; }) {
  const categories = ["전체", "일상", "대인관계", "취업·직장", "도움 요청"];
  const [activeCategory, setActiveCategory] = useState("전체");
  const filtered = scenarios.filter(s => activeCategory === "전체" || s.category === activeCategory);
  return <div className="stack page-enter">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17}/> 홈으로</button>
    <PageTitle eyebrow="PRACTICE" title="AI 상황 연습" description="연습하고 싶은 상황을 직접 골라보세요. 작은 대화부터 시작해도 괜찮아요."/>
    <div className="chip-row" role="group" aria-label="상황 종류 선택">
      {categories.map(category => <button key={category}
        className={"choice-chip" + (activeCategory === category ? " is-selected" : "")}
        aria-pressed={activeCategory === category}
        onClick={() => setActiveCategory(category)}>{category}</button>)}
    </div>
    <section className="section">
      <div className="section-heading">
        <h2>상황 선택하기</h2><span className="count-label">{filtered.length}개</span>
      </div>
      {filtered.length ? <div className="scenario-grid">{filtered.map(item =>
        <button className="scenario-card" key={item.id} onClick={() => onScenario(item)}>
          <span className="scenario-symbol"><CategoryIcon category={item.category}/></span>
          <span className="scenario-category">{item.category}</span>
          <strong>{item.title}</strong>
          <span className="scenario-description">{item.description}</span>
          <span className="scenario-open">연습 살펴보기 <ArrowRight size={16}/></span>
        </button>)}</div> :
        <EmptyState icon={<MessageCircle size={26}/>} title="이 주제의 연습을 준비하고 있어요." description="다른 상황을 먼저 살펴볼 수 있어요."/>}
    </section>
    <p className="footer-promise"><ShieldCheck size={17}/> 연습은 언제든 멈추거나 쉬어갈 수 있어요.</p>
  </div>;
}

export function PracticeIntro({
  scenario, difficulty, onDifficulty, onBack, onStart, busy, error,
}: {
  scenario: Scenario; difficulty: Difficulty; onDifficulty: (v: Difficulty) => void;
  onBack: () => void; onStart: () => void; busy: boolean; error: string;
}) {
  return <div className="narrow-page stack page-enter">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17}/> 다른 연습 보기</button>
    <PageTitle eyebrow="BEFORE WE BEGIN" title="이런 상황을 연습해요." description="어떤 대화를 나눌지 미리 살펴보고 내 속도에 맞게 시작해요."/>
    <section className="content-card intro-scene">
      <div className="scene-head"><span className="scenario-symbol"><CategoryIcon category={scenario.category}/></span><div><span className="scenario-category">{scenario.category}</span><h2>{scenario.title}</h2></div></div>
      <div className="thin-divider"/>
      <div className="detail-group"><h3>어떤 상황인가요?</h3><p>{scenario.description}</p></div>
      <div className="detail-group"><h3>대화 상대</h3><p>{scenario.ai_role}</p></div>
      <div className="detail-group"><h3>연습할 표현</h3><div className="pill-line">{scenario.goal_text.split(/[,·]/).map((word,i) => <span className="mini-pill" key={i}>{word.trim()}</span>)}</div></div>
    </section>
    <section className="section">
      <div className="section-heading"><h2>연습 방식</h2></div>
      <div className="mode-choice is-selected"><span><MessageCircle size={18}/> 텍스트로 대화하기</span><CheckCircle2 size={19}/></div>
      <p className="helper-line">음성 연습은 추후 지원할 예정이에요.</p>
    </section>
    <section className="section">
      <div className="section-heading"><h2>대화 난이도</h2></div>
      <p className="helper-line">지금은 기본 단계가 선택되어 있어요. 언제든 직접 바꿀 수 있어요.</p>
      <div className="difficulty-stack" role="group" aria-label="대화 난이도 선택">
        {([1,2,3] as Difficulty[]).map(d => <button key={d} className={"difficulty-choice" + (difficulty === d ? " is-selected" : "")}
          aria-pressed={difficulty === d} onClick={() => onDifficulty(d)}>
          <span className="difficulty-number">0{d}</span>
          <span className="difficulty-content"><strong>{difficultyLabels[d]}</strong><small>{difficultyDescriptions[d]}</small></span>
          {difficulty === d ? <CheckCircle2 size={20}/> : <span className="empty-radio"/>}
        </button>)}
      </div>
    </section>
    {error && <div className="error-notice" role="alert">{error}</div>}
    <button className="button button--primary button--wide" disabled={busy} onClick={onStart}>{busy ? <LoaderCircle className="spin" size={18}/> : <>연습 시작하기 <ArrowRight size={18}/></>}</button>
    <p className="under-cta">연습 중에도 힌트를 보거나, 잠시 쉬거나, 마칠 수 있어요.</p>
  </div>;
}

export function ChatScreen({
  scenario, difficulty, messages, draft, onDraft, onSend, busy, paused, onPause, onRequestHint, hint, error, onFinish,
}: {
  scenario: Scenario; difficulty: Difficulty; messages: ChatMessage[]; draft: string;
  onDraft: (s: string) => void; onSend: () => void; busy: boolean; paused: boolean;
  onPause: () => void; onRequestHint: () => void; hint: string; error: string; onFinish: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, hint, paused]);
  return <div className="chat-page page-enter">
    <header className="chat-top">
      <div className="chat-top-left"><span className="chat-top-symbol"><CategoryIcon category={scenario.category} size={19}/></span><div><h1>{scenario.title}</h1><p>{scenario.ai_role} · {difficultyLabels[difficulty]}</p></div></div>
      <button className="button button--secondary button--small" onClick={onFinish}>마치기</button>
    </header>
    <div className="chat-frame">
      <div className="conversation" ref={scrollRef} role="log" aria-label="연습 대화" aria-live="polite" aria-relevant="additions">
        <p className="conversation-guide">가상의 {scenario.ai_role}와 연습해요.<br/>준비되면 천천히 말을 걸어보세요.</p>
        {messages.map(m => <div key={m.id} className={"chat-row chat-row--" + m.role}>
          {m.role === "ai" && <span className="chat-avatar"><CategoryIcon category={scenario.category} size={16}/></span>}
          <div className="chat-bubble">{m.text}</div>
        </div>)}
        {busy && <div className="chat-wait" aria-label="응답을 기다리는 중"><span/><span/><span/></div>}
        {paused && <div className="chat-info"><Pause size={17}/> 잠시 쉬는 중이에요. 준비되면 이어서 연습할 수 있어요.</div>}
        {hint && <div className="chat-hint"><Lightbulb size={19}/><span>{hint}</span></div>}
      </div>
      <div className="composer-wrap">
        {error && <div className="error-notice" role="alert">{error}</div>}
        {helpOpen && <div className="hint-pop">
          <div><strong>어떤 말을 해야 할지 막막한가요?</strong><p>작은 표현 힌트를 받을 수 있어요. 실제 대화에는 자동으로 전송되지 않아요.</p></div>
          <button className="button button--secondary button--small" disabled={busy} onClick={() => {onRequestHint();setHelpOpen(false);}}>힌트 받기</button>
        </div>}
        <form className="composer" onSubmit={event => {event.preventDefault();onSend();}}>
          <label className="sr-only" htmlFor="practice-message">대화 메시지 입력</label>
          <input id="practice-message" type="text" maxLength={1000} value={draft} onChange={event=>onDraft(event.target.value)}
            disabled={busy || paused} placeholder={paused ? "쉬는 중이에요" : "하고 싶은 말을 입력해보세요"} autoComplete="off"/>
          <button className="send-button" type="submit" aria-label="메시지 보내기" disabled={busy || paused || !draft.trim()}><Send size={18}/></button>
        </form>
        <div className="practice-tool-row">
          <div className="practice-tool-actions">
            <button className={"tool-pill" + (helpOpen ? " is-selected" : "")} onClick={()=>setHelpOpen(v=>!v)} aria-expanded={helpOpen}><Lightbulb size={17}/> 힌트</button>
            <button className="tool-pill" onClick={onPause}>{paused ? <Play size={16}/> : <Pause size={16}/>} {paused ? "이어하기" : "쉬어가기"}</button>
          </div>
          <span>텍스트 연습</span>
        </div>
      </div>
    </div>
    <p className="chat-footer-note">지금은 연습 중이에요. 정답이나 점수는 없어요.</p>
  </div>;
}

export function ResultScreen({
  feedback, scenario, demo, burden, onBurden, difficultyNote, onDifficultyNote, onRetry, onLibrary, onRecords, onActions, error,
}: {
  feedback: PracticeFeedback; scenario: Scenario; demo: boolean;
  burden: number | null; onBurden: (v: number) => void;
  difficultyNote: string | null; onDifficultyNote: (s: string | null) => void;
  onRetry: () => void; onLibrary: () => void; onRecords: () => void; onActions: () => void; error: string;
}) {
  return <div className="narrow-page stack page-enter result-page">
    <div className="result-intro">
      <span className="result-symbol"><Check size={26}/></span>
      <span className="eyebrow">PRACTICE FINISHED</span>
      <h1>연습을 마쳤어요.</h1>
      <p>이번에 해본 내용을 함께 돌아볼까요?</p>
    </div>
    <div className="status-notice">{demo
      ? "체험 모드의 결과는 예시 데이터이며 실제 AI 분석이 아니에요."
      : "현재 연습 피드백은 키워드에 기반한 참고용 정보예요. 심리 상태 진단이나 AI 평가 결과가 아니에요."}</div>
    <section className="content-card">
      <h2>이번에 해본 표현</h2>
      <p className="body-muted">{feedback.summary}</p>
      <div className="goal-list">
        {feedback.goals.map(goal => <div className="goal-item" key={goal.id}>
          {goal.done ? <CheckCircle2 size={20} className="goal-done"/> : <span className="goal-empty"/>}
          <span>{goal.label}</span>
          {!goal.done && <small>다음에 연습해볼 수 있어요</small>}
        </div>)}
      </div>
    </section>
    <section className="content-card">
      <h2>다음에 연습해볼 표현</h2>
      {feedback.coaching.next.length ? feedback.coaching.next.map((item,i) => <div className="feedback-next" key={i}>
        <p>{item}</p>{feedback.coaching.examples[i] && <div className="example-phrase">예시 · {feedback.coaching.examples[i]}</div>}
      </div>) : <p className="body-muted">오늘 해본 연습을 충분히 마쳤어요.</p>}
    </section>
    <section className="content-card reflection">
      <h2>함께 돌아보기 <span className="optional">선택</span></h2>
      <p className="body-muted">답하지 않고 넘어가도 괜찮아요.</p>
      <h3>어떤 부분이 어려웠나요?</h3>
      <div className="chip-row" role="group" aria-label="어려웠던 부분 선택">
        {["말 시작하기", "대화 이어가기", "마무리하기", "잘 모르겠어요"].map(item => <button key={item} className={"choice-chip" + (difficultyNote === item ? " is-selected" : "")}
          aria-pressed={difficultyNote === item} onClick={() => onDifficultyNote(difficultyNote === item ? null : item)}>{item}</button>)}
      </div>
      <div className="thin-divider"/>
      <h3>이번 연습의 부담 정도는 어땠나요?</h3>
      <div className="scale-buttons" role="group" aria-label="부담 정도 선택">
        {[1,2,3,4,5].map(n => <button key={n} className={"scale-button" + (burden === n ? " is-selected" : "")} aria-pressed={burden === n} aria-label={"부담 정도 " + n + "단계"} onClick={() => onBurden(n)}>{n}</button>)}
      </div>
      <div className="scale-labels"><span>부담이 적었어요</span><span>많이 부담됐어요</span></div>
      <p className="helper-line">어려웠던 부분은 현재 시연 화면에서만 기록돼요.</p>
    </section>
    {error && <div className="error-notice" role="alert">{error}</div>}
    <div className="result-actions">
      <button className="button button--primary" onClick={onRetry}><RotateCcw size={18}/> 같은 상황 다시 연습하기</button>
      <button className="button button--secondary" onClick={onLibrary}>다른 연습 살펴보기 <ArrowRight size={18}/></button>
      <button className="text-link centered" onClick={onRecords}>나의 기록 보기 <BookOpen size={16}/></button>
    </div>
    <div className="support-bridge">
      <p>작은 행동으로 이어가고 싶다면</p>
      <button className="text-link" onClick={onActions}>작은 실천 살펴보기 <ArrowRight size={17}/></button>
    </div>
  </div>;
}
