"use client";

import { useEffect, useRef, useState } from "react";
import AppShell, { ConfirmExit, StatusNotice, type Screen } from "@/components/AppShell";
import HomeScreen from "@/components/HomeScreen";
import RecordsScreen, { type PracticeRecord } from "@/components/RecordsScreen";
import { ActionsScreen, SupportScreen } from "@/components/ExtraScreens";
import { ChatScreen, PracticeIntro, ResultScreen, ScenarioLibrary, type Difficulty } from "@/components/PracticeScreens";
import { apiRequest } from "@/lib/api";
import { demoFeedback, demoResponse, demoScenarios } from "@/lib/demo";
import type { ChatMessage, PracticeFeedback, Scenario } from "@/lib/types";

type Mode = "live" | "demo";
type ResponseMode = "llm" | "mock" | null;

export default function PracticeApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("demo");
  const [online, setOnline] = useState<boolean | null>(null);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const [lastResponseMode, setLastResponseMode] = useState<ResponseMode>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>(demoScenarios);
  const [scenario, setScenario] = useState<Scenario>(demoScenarios[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [focus, setFocus] = useState<string | null>(null);
  const [sid, setSid] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [burden, setBurden] = useState<number | null>(null);
  const [difficultyNote, setDifficultyNote] = useState<string | null>(null);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [showExit, setShowExit] = useState(false);
  const messageId = useRef(1);
  const userTurns = useRef<string[]>([]);
  const lastRecordId = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    apiRequest<Scenario[]>("/scenarios")
      .then(data => {
        if (!mounted) return;
        setOnline(true);
        void apiRequest<{ llm_configured: boolean }>("/runtime")
          .then(runtime => { if (mounted) setLlmConfigured(runtime.llm_configured); })
          .catch(() => { if (mounted) setLlmConfigured(null); });
        if (data.length > 0) {
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

  function navigate(target: Screen) {
    if (screen === "chat" && target !== "chat") {
      setShowExit(true);
      return;
    }
    setError("");
    setScreen(target);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function resetPractice() {
    setMessages([]);
    setDraft("");
    setHint("");
    setError("");
    setFeedback(null);
    setSid(null);
    setBusy(false);
    setPaused(false);
    setBurden(null);
    setDifficultyNote(null);
    setLastResponseMode(null);
    setShowExit(false);
    userTurns.current = [];
  }

  function chooseScenario(item: Scenario) {
    resetPractice();
    setScenario(item);
    setDifficulty(1);
    navigate("intro");
  }

  function push(role: ChatMessage["role"], text: string): number {
    const id = messageId.current++;
    setMessages(previous => [...previous, { id, role, text }]);
    return id;
  }

  async function start() {
    if (busy) return;
    const selectedDifficulty = difficulty;
    resetPractice();
    setBusy(true);
    try {
      if (mode === "live") {
        const data = await apiRequest<{ session_id: number; ai: string }>("/practice/start", "POST", {
          scenario_id: scenario.id,
          difficulty: selectedDifficulty,
          mode: "text",
        });
        setSid(data.session_id);
        if (data.ai.trim()) push("ai", data.ai);
      } else if (scenario.opening?.trim()) {
        push("ai", scenario.opening);
      }
      setScreen("chat");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "연습을 시작하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || busy || paused || screen !== "chat") return;
    setDraft("");
    setHint("");
    setError("");
    userTurns.current = [...userTurns.current, text];
    const pending = push("user", text);
    setBusy(true);
    try {
      if (mode === "live") {
        if (sid === null) throw new Error("연습 세션 정보가 없어요. 다시 시작해 주세요.");
        const response = await apiRequest<{ ai: string; response_mode?: "mock" | "llm" }>(
          "/practice/" + sid + "/message", "POST", { text, complexity: "normal", lead: "normal" }
        );
        setLastResponseMode(response.response_mode ?? null);
        push("ai", response.ai);
      } else {
        push("ai", demoResponse(scenario, text, userTurns.current.length));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "응답을 불러오지 못했어요. 다시 시도해 주세요.");
      setMessages(previous => previous.filter(item => item.id !== pending));
      userTurns.current = userTurns.current.slice(0, -1);
      setDraft(previous => previous || text);
    } finally {
      setBusy(false);
    }
  }

  async function requestHint() {
    if (busy || paused) return;
    setError("");
    if (mode === "demo") {
      setHint(scenario.hints?.[0] || "짧은 문장부터 시작해도 괜찮아요.");
      return;
    }
    if (sid === null) return;
    setBusy(true);
    try {
      const data = await apiRequest<{ hint: string }>("/practice/" + sid + "/hint?level=1", "POST");
      setHint(data.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "힌트를 불러오지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (busy) return;
    if (mode === "live" && sid === null) {
      setError("연습 세션을 찾지 못했어요. 다시 시작해 주세요.");
      setShowExit(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = mode === "live"
        ? await apiRequest<PracticeFeedback>("/practice/" + sid + "/end", "POST", {})
        : demoFeedback(scenario, userTurns.current);
      const recordId = Date.now();
      lastRecordId.current = recordId;
      setRecords(previous => [{
        id: recordId,
        scenarioId: scenario.id,
        title: scenario.title,
        timestamp: new Date().toISOString(),
        summary: data.summary,
        userTurns: userTurns.current.length,
        demo: mode === "demo",
        burden: null,
        difficultyNote: null,
      }, ...previous]);
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
    const recordId = lastRecordId.current;
    setRecords(previous => previous.map(item => item.id === recordId ? { ...item, burden: value } : item));
    if (mode === "live" && sid !== null) {
      try {
        await apiRequest("/practice/" + sid + "/reflect", "POST", { burden: value });
      } catch {
        setError("부담 정도를 서버에 저장하지 못했어요. 다시 선택할 수 있어요.");
        setBurden(null);
        setRecords(previous => previous.map(item => item.id === recordId ? { ...item, burden: null } : item));
      }
    }
  }

  function setReflectionNote(value: string | null) {
    setDifficultyNote(value);
    const recordId = lastRecordId.current;
    setRecords(previous => previous.map(item => item.id === recordId ? { ...item, difficultyNote: value } : item));
  }

  function retry() {
    resetPractice();
    navigate("intro");
  }

  const recent = records.length ? scenarios.find(item => item.id === records[0].scenarioId) ?? null : null;
  const modeLabel = mode === "demo" ? "체험 모드" :
    lastResponseMode === "llm" ? "AI 대화 응답 확인" :
    lastResponseMode === "mock" ? "규칙 기반 응답" :
    llmConfigured ? "AI API 설정됨" : "서버 연결 · 규칙 응답";

  return <>
    <AppShell screen={screen} modeLabel={modeLabel} onNavigate={navigate}>
      {mode === "demo" && (screen === "library" || screen === "intro" || screen === "chat") &&
        <StatusNotice>현재 체험 모드예요. 대화와 결과는 시연용 예시이며 실제 AI 분석이 아니에요.</StatusNotice>}
      {mode === "live" && (screen === "library" || screen === "intro" || screen === "chat") && lastResponseMode !== "llm" && !llmConfigured &&
        <StatusNotice>현재 백엔드의 대화는 규칙 기반 응답일 수 있어요. 실제 AI 모델 연결과는 별개예요.</StatusNotice>}

      {screen === "home" && <HomeScreen scenarios={scenarios} focus={focus} onSetFocus={setFocus}
        lastScenario={recent} onScenario={chooseScenario} onLibrary={() => navigate("library")}
        onActions={() => navigate("actions")} onRecords={() => navigate("records")}/>}
      {screen === "library" && <ScenarioLibrary scenarios={scenarios} onScenario={chooseScenario} onBack={() => navigate("home")}/>}
      {screen === "intro" && <PracticeIntro scenario={scenario} difficulty={difficulty} onDifficulty={setDifficulty}
        onBack={() => navigate("library")} onStart={() => void start()} busy={busy} error={error}/>}
      {screen === "chat" && <ChatScreen scenario={scenario} difficulty={difficulty} messages={messages}
        draft={draft} onDraft={setDraft} onSend={() => void send()} busy={busy} paused={paused}
        onPause={() => setPaused(v => !v)} onRequestHint={() => void requestHint()}
        hint={hint} error={error} onFinish={() => setShowExit(true)}/>}
      {screen === "result" && feedback && <ResultScreen feedback={feedback} scenario={scenario} demo={mode === "demo"}
        burden={burden} onBurden={value => void saveBurden(value)} difficultyNote={difficultyNote}
        onDifficultyNote={setReflectionNote} onRetry={retry} onLibrary={() => navigate("library")}
        onRecords={() => navigate("records")} onActions={() => navigate("actions")} error={error}/>}
      {screen === "records" && <RecordsScreen records={records} onLibrary={() => navigate("library")}
        onRetry={scenarioId => {
          const target = scenarios.find(s => s.id === scenarioId);
          if (target) chooseScenario(target);
          else navigate("library");
        }}/>}
      {screen === "actions" && <ActionsScreen/>}
      {screen === "support" && <SupportScreen onLibrary={() => navigate("library")}/>}
    </AppShell>
    {showExit && <ConfirmExit busy={busy} onCancel={() => setShowExit(false)} onConfirm={() => void finish()}/>}
  </>;
}
