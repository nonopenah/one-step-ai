"use client";

import { ArrowRight, BookOpen, Check, Compass, MessageCircle, MoveUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { Scenario } from "@/lib/types";
import { PageTitle } from "./AppShell";

export default function HomeScreen({
  onLibrary, onActions, onRecords, onScenario, scenarios, lastScenario,
  focus, onSetFocus,
}: {
  onLibrary: () => void;
  onActions: () => void;
  onRecords: () => void;
  onScenario: (scenario: Scenario) => void;
  scenarios: Scenario[];
  lastScenario: Scenario | null;
  focus: string | null;
  onSetFocus: (focus: string | null) => void;
}) {
  const [showCheck, setShowCheck] = useState(false);
  const recommended = scenarios.find(s => focus && s.category === focus) ?? scenarios[0];

  return <div className="stack page-enter">
    <div className="hero-home">
      <span className="eyebrow">나의 공간</span>
      <h1>오늘은 어디서<br className="mobile-only" /> 시작할까요?</h1>
      <p>지금 나에게 필요한 것부터 골라보세요.<br />바로 시작해도, 천천히 둘러봐도 괜찮아요.</p>
    </div>

    <div className="start-grid">
      <button className="start-tile start-tile--primary" onClick={onLibrary}>
        <span className="tile-icon"><MessageCircle size={24} strokeWidth={1.6}/></span>
        <span className="tile-copy"><strong>AI 상황 연습</strong><small>일상과 관계에서 마주칠 대화를 미리 연습해요.</small></span>
        <ArrowRight size={20} className="tile-arrow"/>
      </button>
      <button className="start-tile start-tile--neutral" onClick={onActions}>
        <span className="tile-icon"><Compass size={24} strokeWidth={1.6}/></span>
        <span className="tile-copy"><strong>작은 실천</strong><small>일상에서 해볼 만한 작은 행동을 골라요.</small></span>
        <ArrowRight size={20} className="tile-arrow"/>
      </button>
    </div>

    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">START HERE</span><h2>시작하기 좋은 연습</h2></div><button className="text-link" onClick={onLibrary}>모두 보기 <ArrowRight size={16}/></button></div>
      <div className="feature-card">
        <div className="feature-content">
          <span className="soft-label">{focus ? "선택한 관심 주제" : "첫 연습으로 살펴보기"}</span>
          <h3>{recommended?.title ?? "가벼운 대화부터 시작하기"}</h3>
          <p>{recommended?.description ?? "나에게 맞는 상황을 선택할 수 있어요."}</p>
          <button className="button button--primary" onClick={() => recommended ? onScenario(recommended) : onLibrary()}>
            연습 살펴보기 <ArrowRight size={17}/>
          </button>
        </div>
        <div className="feature-decoration" aria-hidden="true"><span/><span/><MessageCircle size={44} strokeWidth={1.1}/></div>
      </div>
    </section>

    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">MY PACE</span><h2>나에게 맞는 시작점 찾기</h2></div></div>
      <div className="check-card">
        <div><h3>어떤 상황부터 연습하고 싶나요?</h3><p>선택은 자유예요. 답하지 않아도 모든 연습을 이용할 수 있어요.</p></div>
        <button className="button button--secondary" aria-expanded={showCheck} onClick={() => setShowCheck(s => !s)}>{showCheck ? "접기" : "간단히 선택하기"}</button>
      </div>
      {showCheck && <div className="focus-panel">
        <p className="focus-note">관심 주제만 선택해요. 현재 화면에서 연습을 추천하는 데 사용하며 진단이나 AI 분석은 아니에요.</p>
        <div className="chip-row">
          {["대인관계", "일상", "취업·직장", "도움 요청"].map(category => <button key={category}
            className={"choice-chip" + (focus === category ? " is-selected" : "")}
            aria-pressed={focus === category} onClick={() => onSetFocus(focus === category ? null : category)}>
            {focus === category && <Check size={15}/>} {category}
          </button>)}
        </div>
        <button className="text-link" onClick={() => { onSetFocus(null); setShowCheck(false); }}>건너뛰기 / 선택 해제</button>
      </div>}
    </section>

    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">MY JOURNEY</span><h2>나의 기록</h2></div><button className="text-link" onClick={onRecords}>기록 보기 <ArrowRight size={16}/></button></div>
      {lastScenario ?
        <button className="recent-card" onClick={() => onScenario(lastScenario)}>
          <span className="recent-icon"><BookOpen size={22}/></span>
          <span><strong>{lastScenario.title}</strong><small>최근에 연습한 상황 · 다시 연습하기</small></span><MoveUpRight size={18}/>
        </button> :
        <div className="quiet-panel"><BookOpen size={20}/><p>아직 연습 기록이 없어요. 첫 연습을 해본 뒤 여기에서 이어갈 수 있어요.</p></div>}
    </section>
    <p className="footer-promise"><ShieldCheck size={17}/> 언제든 멈추거나 다른 활동을 선택할 수 있어요.</p>
  </div>;
}
