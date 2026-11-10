import type { PracticeFeedback, Scenario } from "./types";

export const demoScenarios: Scenario[] = [
  {
    id: "store_question",
    title: "편의점에서 물건 위치 물어보기",
    category: "일상",
    description: "직원은 계산대에서 물건을 정리 중이에요. 찾는 물건이 보이지 않아 직접 말을 걸어야 해요.",
    goal_text: "먼저 말 걸기 · 필요한 정보 묻기 · 마무리하기",
    ai_role: "편의점 직원",
    opening: "",
    hints: ["'저기요, 혹시 ○○은 어디에 있나요?'라고 시작해 봐도 좋아요."],
    examples: ["저기요, 컵라면은 어디에 있나요?"],
  },
  {
    id: "greeting",
    title: "처음 만난 사람에게 인사하기",
    category: "대인관계",
    description: "소규모 모임에서 옆자리에 앉은 사람과 첫인사를 나누는 상황이에요.",
    goal_text: "인사하기 · 한 문장으로 소개하기 · 질문 건네기",
    ai_role: "모임 참가자",
    opening: "안녕하세요.",
    hints: ["'안녕하세요, 저도 처음 왔어요.'처럼 짧게 시작해도 괜찮아요."],
    examples: ["안녕하세요. 저는 오늘 처음 왔어요."],
  },
  {
    id: "inquiry_call",
    title: "지원기관에 문의하기",
    category: "도움 요청",
    description: "청년 지원 프로그램이 궁금해 담당자에게 연락하는 상황이에요.",
    goal_text: "문의 목적 말하기 · 궁금한 점 묻기 · 마무리하기",
    ai_role: "기관 담당자",
    opening: "안녕하세요. 청년지원센터입니다.",
    hints: ["'프로그램 신청에 대해 문의하고 싶어요.'라고 시작해 봐도 좋아요."],
    examples: ["안녕하세요. 참여 방법을 여쭤보고 싶어요."],
  },
];

export function demoResponse(scenario: Scenario, userText: string, userTurn: number): string {
  const text = userText.replace(/\s+/g, "");
  if (/고마|감사|안녕히|수고/.test(text)) return "네, 좋은 하루 보내세요.";
  if (scenario.id === "store_question") {
    if (/라면/.test(text)) return "라면은 안쪽 오른편 진열대에 있어요.";
    if (/우유|음료|물/.test(text)) return "음료는 입구 옆 냉장고에 있어요.";
    if (/과자|초콜릿|젤리/.test(text)) return "과자는 가운데 진열대에 있어요.";
    if (/(어디|위치|찾고|있나요|있어요)/.test(text)) return "어떤 물건을 찾고 계세요?";
    return userTurn === 1 ? "네, 말씀하세요." : "네, 다른 필요한 건 없으세요?";
  }
  if (scenario.id === "inquiry_call") {
    return userTurn === 1 ? "네, 어떤 내용이 궁금하신가요?" : "연습용 안내라 실제 신청 조건은 기관에 확인해 주세요.";
  }
  return userTurn === 1 ? "반가워요. 오늘은 어떻게 오셨어요?" : "그렇군요. 이야기해 주셔서 감사해요.";
}

export function demoFeedback(scenario: Scenario, utterances: string[]): PracticeFeedback {
  return {
    summary: utterances.length
      ? "이번에 " + utterances.length + "번 말해보았어요. 아래는 기능을 확인하기 위한 예시 피드백이며 실제 대화 분석 결과가 아니에요."
      : "아직 발화하지 않고 마쳤어요. 언제든 다시 시도할 수 있어요.",
    goals: [
      { id: "begin", label: "첫 메시지를 보내기", done: utterances.length > 0 },
      { id: "continue", label: "대화를 한 번 더 이어가기", done: utterances.length > 1 },
    ],
    coaching: {
      good: utterances.length ? ["대화 연습을 시작해 보았어요."] : [],
      next: ["다음에는 원하는 정보를 한 문장으로 말해보는 것을 연습해봐요."],
      examples: [scenario.examples?.[0] ?? "안녕하세요. 질문 하나 해도 될까요?"],
    },
    next: { retry_scenario: scenario.id, action: null, programs: [] },
  };
}
