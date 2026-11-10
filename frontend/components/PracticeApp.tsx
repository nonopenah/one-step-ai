"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp,
  Compass, HeartHandshake, Home, Leaf, LoaderCircle, Menu, MessageCircle,
  Pause, Play, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, X
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { demoFeedback, demoResponse, demoScenarios } from "@/lib/demo";
import type { ChatMessage, PracticeFeedback, Scenario } from "@/lib/types";

type Screen = "library" | "intro" | "chat" | "result";
type Mode = "live" | "demo";
type Difficulty = 1 | 2 | 3;
const fallbackScenario = demoScenarios[0];

function IconForCategory({ category }: { category: string }) {
  if (category.includes("도움")) return <HeartHandshake size={22} strokeWidth={1.7} />;
  if (category.includes("대인")) return <MessageCircle size={22} strokeWidth={1.7} />;
  return <Compass size={22} strokeWidth={1.7} />;
}

export default function PracticeApp() {
  const [screen, setScreen] = useState<Screen>("library");
  const [mode, setMode] = useState<Mode>("demo");
  const [online, setOnline] = useState<boolean | null>(null);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const [lastResponseMode, setLastResponseMode] = useState<"llm" | "mock" | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(demoScenarios);
  const [scenario, setScenario] = useState<Scenario>(fallbackScenario);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [sid, setSid] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [burden, setBurden] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(1);
  const userTurns = useRef<string[]>([]);

  useEffect(() => {
    let mounted = true;
    apiRequest<Scenario[]>("/scenarios")
      .then((data) => {
        if (!mounted) return;
        setOnline(true);
        void apiRequest<{ llm_configured: boolean }>("/runtime")
          .then(runtime => { if (mounted) setLlmConfigured(runtime.llm_configured); })
          .catch(() => { if (mounted) setLlmConfigured(null); });
        if (data.length) {
          setMode("live");
          setScenarios(data);
          setScenario(data[0]);
        }
      })
      .catch(() => {
        if (mounted) {
          setOnline(false);
          setMode("demo");
        }
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, hint]);

  function push(role: ChatMessage["role"], text: string): number {
    const id = messageId.current++;
    setMessages(prev => [...prev, { id, role, text }]);
    return id;
  }

  function chooseScenario(item: Scenario) {
    setScenario(item);
    setDifficulty(1);
    setFeedback(null);
    setError("");
    setScreen("intro");
    window.scrollTo({ top: 0 });
  }

  function reset() {
    setMessages([]);
    setFeedback(null);
    setHint("");
    setError("");
    setDraft("");
    setSid(null);
    setPaused(false);
    setShowHelp(false);
    setShowExit(false);
    setBurden(null);
    setLastResponseMode(null);
    userTurns.current = [];
  }

  async function start() {
    if (busy) return;
    reset();
    setBusy(true);
    try {
      if (mode === "live") {
        const data = await apiRequest<{ session_id: number; ai: string }>("/practice/start", "POST", {
          scenario_id: scenario.id, difficulty, mode: "text"
        });
        setSid(data.session_id);
        if (data.ai.trim()) push("ai", data.ai);
      } else if (scenario.opening?.trim()) {
        push("ai", scenario.opening);
      }
      setScreen("chat");
    } catch (e) {
      setError(e instanceof Error ? e.message : "연습을 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || busy || paused || screen !== "chat") return;
    setError("");
    setDraft("");
    setHint("");
    userTurns.current = [...userTurns.current, text];
    const pendingMessageId = push("user", text);
    setBusy(true);
    try {
      if (mode === "live") {
        if (sid === null) throw new Error("세션 정보가 없어요. 다시 시작해 주세요.");
        const data = await apiRequest<{ ai: string; response_mode?: "mock" | "llm" }>(`/practice/${sid}/message`, "POST", { text, complexity: "normal", lead: "normal" });
        setLastResponseMode(data.response_mode ?? null);
        push("ai", data.ai);
      } else {
        push("ai", demoResponse(scenario, text, userTurns.current.length));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "응답을 불러오지 못했어요.");
      // 응답 실패 시 해당 발화는 서버에 저장되지 않았으므로 입력창으로 되돌려 재시도 가능하게 한다.
      setMessages(prev => prev.filter(message => message.id !== pendingMessageId));
      userTurns.current = userTurns.current.slice(0, -1);
      setDraft(current => current || text);
    } finally {
      setBusy(false);
    }
  }

  async function requestHint() {
    if (busy) return;
    setError("");
    if (mode === "demo") {
      setHint(scenario.hints?.[0] || "한 문장으로 천천히 시작해 봐도 괜찮아요.");
      setShowHelp(false);
      return;
    }
    if (sid === null) return;
    setBusy(true);
    try {
      const data = await apiRequest<{ hint: string }>(`/practice/${sid}/hint?level=1`, "POST");
      setHint(data.hint);
      setShowHelp(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "도움말을 불러오지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = mode === "live"
        ? await apiRequest<PracticeFeedback>(`/practice/${sid}/end`, "POST", {})
        : demoFeedback(scenario, userTurns.current);
      setFeedback(data);
      setScreen("result");
      setShowExit(false);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결과를 불러오지 못했어요.");
      setShowExit(false);
    } finally {
      setBusy(false);
    }
  }

  async function saveBurden(value: number) {
    setBurden(value);
    if (mode === "live" && sid !== null) {
      try {
        await apiRequest(`/practice/${sid}/reflect`, "POST", { burden: value });
      } catch {
        setError("느낌 기록을 저장하지 못했어요. 다시 선택할 수 있어요.");
        setBurden(null);
      }
    }
  }

  const label = screen === "library" ? "AI 상황 연습" : screen === "intro" ? "연습 준비" : screen === "chat" ? "대화 연습" : "연습 돌아보기";

  return (
    <div className="site-shell">
      <aside className={`side-panel ${mobileMenu ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-symbol"><Leaf size={20} strokeWidth={2} /></div><span>한걸음<small>ONE STEP</small></span></div>
        <div className="side-subtitle">나의 속도로, 한 걸음씩</div>
        <nav className="navigation" aria-label="메인 메뉴">
          <button className="nav-item" onClick={() => { setScreen("library"); setMobileMenu(false); }}><Home size={19} /> 홈</button>
          <button className="nav-item active" onClick={() => { setScreen("library"); setMobileMenu(false); }}><MessageCircle size={19} /> AI 상황 연습 <span className="nav-dot" /></button>
          <div className="nav-separator" />
          <div className="nav-section-label">조금씩 확장해요</div>
          <div className="nav-item inactive"><Compass size={19} /> 작은 실천 <span>예정</span></div>
          <div className="nav-item inactive"><HeartHandshake size={19} /> 도움과 연결 <span>예정</span></div>
          <div className="nav-item inactive"><BookOpen size={19} /> 나의 기록 <span>예정</span></div>
        </nav>
        <div className="side-bottom">
          <div className="side-note"><Sparkles size={18}/><span>잘해야 하는 연습이 아니에요.<br />오늘의 시도만으로 충분해요.</span></div>
          <div className="side-version">ONE STEP · UI PROTOTYPE v0.0</div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" aria-label="메뉴 닫기" onClick={() => setMobileMenu(false)}/>}
      <main className="main-panel">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-button icon-button" aria-label="메뉴 열기" onClick={() => setMobileMenu(true)}><Menu size={21}/></button>
            <span className="breadcrumb">한걸음</span><ChevronRight size={16} className="breadcrumb-icon" /><span className="breadcrumb-current">{label}</span>
          </div>
          <div className="header-right">
            <span className={`connection-pill ${mode === "demo" ? "demo" : "live"}`}><span className="connection-dot"/>{mode === "demo" ? "체험 모드" : lastResponseMode === "mock" ? "규칙 기반 응답" : lastResponseMode === "llm" ? "AI 응답 확인됨" : llmConfigured ? "AI API 설정됨" : "서버 연결 · 규칙 응답"}</span>
            <span className="header-avatar" aria-label="게스트">G</span>
          </div>
        </header>

        <div className="page-body">
          {mode === "live" && (!llmConfigured || lastResponseMode === "mock") && <div className="demo-notice"><CircleHelp size={17}/><span>백엔드에 연결되어 있지만 현재 대화는 규칙 기반 예시 응답일 수 있어요. AI 응답을 사용하려면 모델 설정과 실제 호출 결과를 확인해 주세요.</span></div>}
          {mode === "demo" && <div className="demo-notice"><CircleHelp size={17}/><span>체험 모드예요. 대화와 결과는 예시로 표시되며 실제 AI 분석이 아닙니다.</span>{online === false && <span className="notice-extra">백엔드 미연결</span>}</div>}
          {screen === "library" && (
            <div className="page-enter">
              <div className="eyebrow">PRACTICE SPACE <span className="eyebrow-line"/></div>
              <div className="title-row"><div><h1>작은 대화부터<br /><em>천천히 연습해봐요.</em></h1><p className="page-description">실제 상황이 조금 부담스럽다면, 여기서 먼저 연습해도 괜찮아요.<br className="desktop-br"/> 정답도 점수도 없이, 나에게 맞는 속도로 시작해요.</p></div><div className="title-decoration"><div className="deco-circle deco-one"/><div className="deco-circle deco-two"/><Sparkles size={30}/></div></div>
              <section className="featured-area">
                <div className="section-header"><div><span className="section-kicker">RECOMMENDED</span><h2>오늘은 여기서 시작해볼까요?</h2></div></div>
                <div className="featured-card">
                  <div className="feature-icon"><MessageCircle size={27} strokeWidth={1.5}/></div>
                  <div className="feature-content"><span className="tag-light">부담 없는 첫 연습</span><h3>{scenarios[0]?.title}</h3><p>{scenarios[0]?.description}</p><button className="primary-button" onClick={() => chooseScenario(scenarios[0] || fallbackScenario)}>연습 살펴보기 <ArrowRight size={17}/></button></div>
                  <div className="feature-art" aria-hidden="true"><span className="art-bubble art-a">안녕하세요!</span><span className="art-bubble art-b">천천히 말해도 괜찮아요</span><div className="feature-orbit"><MessageCircle size={48} strokeWidth={1}/></div></div>
                </div>
              </section>
              <section className="scenarios-area">
                <div className="section-header"><div><span className="section-kicker">EXPLORE</span><h2>다양한 상황을 연습해요</h2><p>지금 나에게 필요한 연습을 골라보세요.</p></div><span className="scenario-count">전체 {scenarios.length}개</span></div>
                <div className="scenario-grid">
                  {scenarios.map((item, index) => (
                    <button key={item.id} className="scenario-card" onClick={() => chooseScenario(item)}>
                      <span className={`scenario-icon scenario-icon-${index % 3}`}><IconForCategory category={item.category}/></span>
                      <span className="scenario-category">{item.category}</span>
                      <strong>{item.title}</strong>
                      <span className="scenario-desc">{item.description}</span>
                      <span className="scenario-link">연습 살펴보기 <ArrowRight size={16}/></span>
                    </button>
                  ))}
                </div>
              </section>
              <div className="gentle-footer"><ShieldCheck size={19}/><span>연습은 언제든 멈출 수 있고, 도움이 필요하면 힌트를 볼 수 있어요.</span></div>
            </div>
          )}

          {screen === "intro" && (
            <div className="detail-container page-enter">
              <button className="text-back" onClick={() => setScreen("library")}><ArrowLeft size={18}/> 다른 연습 살펴보기</button>
              <span className="eyebrow">BEFORE WE BEGIN</span>
              <h1 className="detail-title">이런 상황을<br/><em>함께 연습해볼 거예요.</em></h1>
              <p className="page-description">잘하려고 애쓰지 않아도 괜찮아요. 한마디씩 시작해봐요.</p>
              <div className="intro-card">
                <div className="intro-card-top"><span className="scenario-icon"><IconForCategory category={scenario.category}/></span><div><span className="scenario-category">{scenario.category} · 상황 연습</span><h2>{scenario.title}</h2></div></div>
                <div className="intro-divider"/>
                <div className="intro-group"><span className="intro-label">어떤 상황인가요?</span><p>{scenario.description}</p></div>
                <div className="intro-group"><span className="intro-label">이렇게 연습해요</span><p>{scenario.goal_text}</p></div>
                <div className="intro-group"><span className="intro-label">대화 상대</span><p>{scenario.ai_role}</p></div>
              </div>
              <div className="difficulty-box"><div><h3>대화 난이도</h3><p>처음이라면 편안한 단계부터 시작해보세요.</p></div><div className="difficulty-options">{([1,2,3] as Difficulty[]).map(d => <button key={d} className={`difficulty-option ${difficulty===d?"selected":""}`} onClick={() => setDifficulty(d)} aria-pressed={difficulty===d}><span>{d===1?"편안하게":d===2?"조금 더 현실적으로":"실전처럼"}</span>{difficulty===d && <Check size={16}/>}</button>)}</div></div>
              {error && <div className="error-box" role="alert">{error}</div>}
              <div className="intro-actions"><button className="primary-button large" disabled={busy} onClick={start}>{busy?<LoaderCircle className="spin" size={19}/>:<>연습 시작하기 <ArrowRight size={19}/></>}</button><p>원하는 만큼 연습하고 언제든 종료할 수 있어요.</p></div>
            </div>
          )}

          {screen === "chat" && (
            <div className="chat-layout page-enter">
              <div className="chat-heading"><button className="text-back" onClick={() => setShowExit(true)}><ArrowLeft size={18}/> 연습 목록</button><div className="chat-heading-row"><div><span className="section-kicker">PRACTICE SESSION</span><h1>{scenario.title}</h1><p>{scenario.ai_role}와 대화를 연습하고 있어요.</p></div><span className="tag-light">{difficulty}단계</span></div></div>
              <div className="chat-workspace">
                <div className="chat-panel">
                  <div className="chat-panel-head"><div className="chat-persona-icon"><IconForCategory category={scenario.category}/></div><div><strong>{scenario.ai_role}</strong><small>사회상황 연습 파트너</small></div><span className="session-indicator"><span/> 연습 중</span></div>
                  <div className="chat-messages" ref={scrollRef} aria-live="polite">
                    <div className="chat-day">지금 · 연습 대화</div>
                    <div className="system-intro">{scenario.description}<br/><span>준비되면 먼저 말을 걸어보세요. 천천히 시작해도 괜찮아요.</span></div>
                    {messages.map(m => <div key={m.id} className={`message-line ${m.role}`}>{m.role==="ai"&&<div className="message-avatar"><IconForCategory category={scenario.category}/></div>}<div className="message-bubble">{m.text}</div></div>)}
                    {busy && <div className="typing-message"><span/><span/><span/></div>}
                    {paused && <div className="paused-message"><Pause size={16}/> 잠시 쉬는 중이에요. 준비되면 다시 시작하세요.</div>}
                    {hint && <div className="hint-message"><Sparkles size={17}/><span>{hint}</span></div>}
                  </div>
                  {error && <div className="chat-error" role="alert">{error}</div>}
                  <form className="chat-input-area" onSubmit={e => {e.preventDefault();void send();}}>
                    <label htmlFor="chat-message" className="sr-only">대화 메시지 입력</label>
                    <input id="chat-message" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={paused?"쉬는 중이에요":"하고 싶은 말을 입력해보세요..."} disabled={paused || busy} maxLength={1000} autoComplete="off"/>
                    <button className="send-button" type="submit" disabled={!draft.trim() || busy || paused} aria-label="메시지 보내기"><Send size={19}/></button>
                  </form>
                  <div className="chat-input-caption">말이 떠오르지 않는다면 오른쪽의 도움 기능을 이용해보세요.</div>
                </div>
                <aside className="chat-tools"><div className="tool-card"><div className="tool-title"><Sparkles size={19}/><h3>대화가 어렵다면</h3></div><p>잠시 멈춰도, 도움을 받아도 괜찮아요.</p><button className="tool-button" onClick={() => setShowHelp(s=>!s)}><CircleHelp size={17}/> 힌트 보기 <ChevronRight size={16}/></button>{showHelp&&<div className="hint-panel"><p>지금 어떤 말을 하면 좋을지 작은 힌트를 받아보세요.</p><button className="secondary-button" disabled={busy} onClick={() => void requestHint()}>힌트 받기</button></div>}</div><div className="tool-card"><div className="tool-title"><Settings2 size={19}/><h3>내 속도에 맞추기</h3></div><p>연습을 잠깐 쉬거나 오늘은 여기까지 할 수 있어요.</p><button className="tool-button" onClick={()=>setPaused(s=>!s)}>{paused?<Play size={17}/>:<Pause size={17}/>} {paused?"다시 이어하기":"잠시 쉬어가기"}</button><button className="tool-button end-button" onClick={()=>setShowExit(true)}><Check size={17}/> 연습 마치기</button></div><div className="tool-note"><Leaf size={17}/> 완벽한 대화보다 시작해본 경험이 중요해요.</div></aside>
              </div>
            </div>
          )}

          {screen === "result" && feedback && (
            <div className="detail-container result-container page-enter"><div className="result-emblem"><Check size={28}/></div><span className="eyebrow center">PRACTICE COMPLETE</span><h1 className="result-title">오늘도 한 걸음,<br/><em>연습을 마쳤어요.</em></h1><p className="result-subtitle">끝까지 해보았다는 것만으로 충분히 의미 있어요.</p>{mode==="demo"?<div className="demo-feedback-warning">이 결과는 데모용 예시이며 AI가 대화를 평가한 결과가 아니에요.</div>:<div className="demo-feedback-warning">현재 피드백은 발화의 키워드를 기준으로 생성한 참고용 결과예요. AI 분석 모델은 아직 연결되지 않았어요.</div>}
              <div className="result-card"><div className="result-card-heading"><Sparkles size={20}/><h2>오늘의 연습</h2></div><p className="result-summary">{feedback.summary}</p><div className="result-goals">{feedback.goals.map(g=><div key={g.id} className="goal-item"><span className={g.done?"goal-check checked":"goal-check"}>{g.done?<Check size={14}/>:<span/>}</span>{g.label}</div>)}</div></div>
              <div className="result-card"><div className="result-card-heading"><Leaf size={20}/><h2>함께 돌아보기</h2></div>{feedback.coaching.good.length>0&&<div className="feedback-section"><span>해본 일</span>{feedback.coaching.good.map((g,i)=><p key={i}>{g}</p>)}</div>}<div className="feedback-section"><span>다음에 연습해볼 일</span>{feedback.coaching.next.length?feedback.coaching.next.map((n,i)=><div key={i}><p>{n}</p>{feedback.coaching.examples[i]&&<blockquote>예시 · {feedback.coaching.examples[i]}</blockquote>}</div>):<p>오늘의 연습을 충분히 마쳤어요.</p>}</div></div>
              <div className="reflect-card"><h3>이번 연습은 어땠나요? <span>선택</span></h3><p>부담 정도를 남겨도 되고 그냥 넘어가도 괜찮아요.</p><div className="burden-options">{[1,2,3,4,5].map(value=><button key={value} aria-label={`부담 정도 ${value}단계`} aria-pressed={burden===value} className={burden===value?"picked":""} onClick={()=>void saveBurden(value)}>{value}</button>)}</div><div className="burden-legend"><span>편안했어요</span><span>많이 부담됐어요</span></div></div>
              {error&&<div role="alert" className="error-box">{error}</div>}
              <div className="result-actions"><button className="primary-button large" onClick={()=>{reset();setScreen("intro");window.scrollTo({top:0});}}><RotateCcw size={18}/> 다시 연습하기</button><button className="secondary-button large" onClick={()=>{reset();setScreen("library");window.scrollTo({top:0});}}>다른 연습 살펴보기 <ArrowRight size={18}/></button></div>
            </div>
          )}
        </div>
      </main>

      {showExit && <div className="dialog-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowExit(false)}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title"><button className="dialog-close" onClick={()=>setShowExit(false)} aria-label="닫기"><X size={20}/></button><div className="dialog-icon"><Leaf size={25}/></div><h2 id="exit-dialog-title">여기서 연습을 마칠까요?</h2><p>짧게 연습해도 괜찮아요. 지금까지의 대화를 돌아볼 수 있어요.</p>{error && <div className="error-box" role="alert">{error}</div>}<div className="dialog-actions"><button className="secondary-button" onClick={()=>setShowExit(false)}>조금 더 연습하기</button><button className="primary-button" disabled={busy} onClick={()=>void finish()}>{busy?"정리 중...":"연습 마치기"}</button></div></div></div>}
    </div>
  );
}
