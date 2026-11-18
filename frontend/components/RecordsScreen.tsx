"use client";

import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, MessageCircle } from "lucide-react";
import type { Scenario } from "@/lib/types";
import { EmptyState, PageTitle } from "./AppShell";

export type PracticeRecord = {
  id: number;
  scenarioId: string;
  title: string;
  timestamp: string;
  summary: string;
  userTurns: number;
  demo: boolean;
  burden: number | null;
  difficultyNote: string | null;
};

export default function RecordsScreen({
  records, onLibrary, onRetry,
}: {
  records: PracticeRecord[];
  onLibrary: () => void;
  onRetry: (scenarioId: string) => void;
}) {
  return <div className="stack page-enter">
    <PageTitle eyebrow="MY JOURNEY" title="나의 기록" description="연습해본 순간들을 천천히 돌아볼 수 있어요." />
    <div className="record-note" role="note">현재 이 화면은 UI 시연용으로, 기록 목록은 페이지를 새로고침하면 초기화돼요. 서버 기록 조회와 저장 설정은 이후 연결될 예정이에요.</div>
    {records.length === 0 ? <EmptyState icon={<BookOpen size={29}/>} title="아직 남겨진 기록이 없어요." description="연습을 마치면 이곳에서 내가 해본 내용을 돌아볼 수 있어요." action={<button className="button button--primary" onClick={onLibrary}>연습 살펴보기 <ArrowRight size={17}/></button>} /> : <>
      <div className="growth-card">
        <div><span className="eyebrow">SMALL STEPS</span><h2>하나씩 쌓이는 나의 시도</h2><p>서로 비교할 필요 없이 내가 해본 경험을 기억해요.</p></div>
        <svg className="growth-graphic" viewBox="0 0 340 130" role="img" aria-label="작은 점들이 이어지는 성장 경로를 표현한 그림">
          <path d="M20 96 C67 97 78 40 130 56 S198 111 240 66 S291 40 319 19" stroke="#CED9DD" strokeWidth="9" strokeLinecap="round" fill="none"/>
          <path d="M20 96 C67 97 78 40 130 56 S198 111 240 66" stroke="#647E89" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 9" fill="none"/>
          <circle cx="20" cy="96" r="7" fill="#728C96"/><circle cx="81" cy="57" r="7" fill="#728C96"/><circle cx="146" cy="62" r="7" fill="#728C96"/><circle cx="240" cy="66" r="9" fill="#425963"/><circle cx="319" cy="19" r="7" stroke="#A9C1CA" strokeDasharray="3 3" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><span>이 화면에서 마친 연습</span><strong>{records.length}회</strong></div>
        <div className="stat-card"><span>연습해본 상황</span><strong>{new Set(records.map(r => r.scenarioId)).size}가지</strong></div>
      </div>
      <section className="section">
        <div className="section-heading"><h2>활동 기록</h2></div>
        <div className="record-list">
          {records.map(record => <article className="record-item" key={record.id}>
            <div className="record-symbol"><MessageCircle size={19}/></div>
            <div className="record-body">
              <span className="record-date"><CalendarDays size={14}/> {new Date(record.timestamp).toLocaleDateString("ko-KR")} · {record.demo ? "체험 연습" : "대화 연습"}</span>
              <h3>{record.title}</h3>
              <p>{record.summary}</p>
              {record.burden && <span className="record-meta">기록한 부담 정도: {record.burden}/5</span>}
              {record.difficultyNote && <span className="record-meta">어려웠던 부분: {record.difficultyNote}</span>}
              <button className="text-link" onClick={() => onRetry(record.scenarioId)}>다시 연습하기 <ArrowRight size={16}/></button>
            </div>
          </article>)}
        </div>
      </section>
    </>}
  </div>;
}
