"use client";

import { BookOpen, Compass, HeartHandshake, Home, Menu, MessageCircle, Settings2, X } from "lucide-react";
import type { ReactNode } from "react";

export type Screen = "home" | "library" | "intro" | "chat" | "result" | "records" | "actions" | "support";

const navItems = [
  { id: "home", label: "홈", Icon: Home },
  { id: "library", label: "AI 상황 연습", Icon: MessageCircle },
  { id: "actions", label: "작은 실천", Icon: Compass },
  { id: "records", label: "나의 기록", Icon: BookOpen },
  { id: "support", label: "도움과 연결", Icon: HeartHandshake },
] as const;

function navFor(screen: Screen): string {
  if (screen === "intro" || screen === "chat" || screen === "result") return "library";
  return screen;
}

export default function AppShell({
  children, screen, modeLabel, onNavigate,
}: {
  children: ReactNode;
  screen: Screen;
  modeLabel: string;
  onNavigate: (screen: Screen) => void;
}) {
  const focused = screen === "chat";
  const current = navFor(screen);

  return (
    <div className={"shell" + (focused ? " shell--focused" : "")}>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      {!focused && (
        <aside className="sidebar" aria-label="서비스 메뉴">
          <button className="brand" onClick={() => onNavigate("home")} aria-label="한걸음 홈">
            <span className="brand-mark" aria-hidden="true">↗</span>
            <span>한걸음<small>ONE STEP</small></span>
          </button>
          <p className="brand-subline">나의 속도로, 한 걸음씩</p>
          <nav className="side-nav" aria-label="메인 메뉴">
            {navItems.map(({ id, label, Icon }) => (
              <button key={id} className={"nav-link" + (current === id ? " is-active" : "")}
                aria-current={current === id ? "page" : undefined}
                onClick={() => onNavigate(id)}>
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <p>연습은 언제든 쉬어갈 수 있어요.<br />원하는 만큼만 해보세요.</p>
            <span>ONE STEP · UI PREVIEW</span>
          </div>
        </aside>
      )}
      <div className="app-main">
        {!focused && (
          <header className="topbar">
            <span className="topbar-section">{navItems.find(item => item.id === current)?.label ?? "한걸음"}</span>
            <div className="topbar-meta">
              <span className="mode-indicator" title="현재 응답 방식을 나타냅니다.">{modeLabel}</span>
              <span className="guest-label" aria-label="게스트 사용자">G</span>
            </div>
          </header>
        )}
        <main id="main-content" className={focused ? "page page--chat" : "page"}>{children}</main>
      </div>
      {!focused && (
        <nav className="mobile-tabs" aria-label="모바일 메인 메뉴">
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} className={"mobile-tab" + (current === id ? " is-active" : "")}
              aria-current={current === id ? "page" : undefined} onClick={() => onNavigate(id)}>
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label === "AI 상황 연습" ? "연습" : label === "도움과 연결" ? "연결" : label === "작은 실천" ? "실천" : label === "나의 기록" ? "기록" : label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function PageTitle({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="page-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p className="body-muted">{description}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h2>{title}</h2>
    <p>{description}</p>
    {action}
  </div>;
}

export function StatusNotice({ children }: { children: ReactNode }) {
  return <div className="status-notice" role="status">{children}</div>;
}

export function ConfirmExit({ busy, onCancel, onConfirm }: {
  busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return <div className="dialog-overlay" onMouseDown={event => { if (event.currentTarget === event.target) onCancel(); }}>
    <div className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="exit-heading">
      <button className="icon-only dialog-close" onClick={onCancel} aria-label="닫기"><X size={20}/></button>
      <h2 id="exit-heading">여기서 연습을 마칠까요?</h2>
      <p>짧게 연습했어도 괜찮아요. 이번에 해본 내용을 돌아볼 수 있어요.</p>
      <div className="dialog-actions">
        <button className="button button--secondary" onClick={onCancel}>계속 연습하기</button>
        <button className="button button--primary" disabled={busy} onClick={onConfirm}>{busy ? "정리 중..." : "연습 마치기"}</button>
      </div>
    </div>
  </div>;
}
