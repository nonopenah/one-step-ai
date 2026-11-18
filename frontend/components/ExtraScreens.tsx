"use client";

import { ArrowRight, Check, Compass, HeartHandshake, Info, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "./AppShell";

const samples = [
  {id:"drink",title:"가까운 가게에서 음료 고르기",description:"구매하지 않아도 괜찮아요. 가게를 둘러보는 것만으로도 시도할 수 있어요."},
  {id:"hello",title:"짧게 인사하기",description:"마주친 사람에게 인사를 건네거나, 인사하는 표현을 생각해봐요."},
  {id:"walk",title:"집 주변을 잠깐 걷기",description:"시간이나 거리를 정하지 않고 가능한 만큼 움직여봐요."},
];
export function ActionsScreen() {
  const [done,setDone] = useState<string[]>([]);
  return <div className="stack page-enter">
    <PageTitle eyebrow="SMALL ACTIONS" title="작은 실천" description="지금 가능한 만큼만 선택해보세요. 꼭 완료해야 하는 과제는 아니에요."/>
    <div className="record-note">이 페이지는 UI 시연용이에요. 완료 체크는 현재 화면에서만 유지되며 서버에 저장되지 않아요.</div>
    <div className="action-list">{samples.map(a=><article className="content-card action-card" key={a.id}>
      <div className="action-symbol"><Compass size={20}/></div>
      <div><h2>{a.title}</h2><p>{a.description}</p><button className={"button button--secondary button--small" + (done.includes(a.id) ? " selected-action" : "")}
      aria-pressed={done.includes(a.id)} onClick={()=>setDone(v=>v.includes(a.id)?v.filter(x=>x!==a.id):[...v,a.id])}>
        {done.includes(a.id)? <><Check size={16}/> 시도했다고 표시했어요</> : "시도했다고 표시하기"}
      </button></div>
    </article>)}</div>
  </div>;
}
export function SupportScreen({onLibrary}:{onLibrary:()=>void}) {
  return <div className="stack page-enter">
    <PageTitle eyebrow="SUPPORT" title="도움과 연결" description="혼자서 준비한 다음, 필요할 때 도움을 살펴볼 수 있어요."/>
    <div className="record-note"><Info size={17}/> 현재는 UI 시연 화면으로, 실제 기관 조회·추천·상담 신청 기능은 아직 연결되지 않았어요.</div>
    <section className="content-card support-section"><span className="support-icon"><HeartHandshake size={26}/></span>
      <h2>지원 정보를 살펴보는 것도 하나의 시작이에요.</h2>
      <p>사회적 관계, 일상 회복, 상담과 같은 지원을 제공하는 기관이 있어요. 실제 지원 조건과 신청 방법은 해당 기관에서 확인해야 해요.</p>
    </section>
    <section className="content-card support-section"><h2>연락하기 전에 미리 연습해볼까요?</h2><p>기관에 문의하는 상황을 AI와 먼저 연습할 수 있어요.</p>
      <button className="button button--primary" onClick={onLibrary}>상황 연습 살펴보기 <ArrowRight size={17}/></button>
    </section>
    <p className="footer-promise"><ShieldCheck size={17}/> 서비스를 이용한다고 실제 기관에 자동으로 연락이 가지 않아요.</p>
  </div>;
}
