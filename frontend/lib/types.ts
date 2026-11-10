export type Scenario = {
  id: string;
  title: string;
  category: string;
  description: string;
  goal_text: string;
  ai_role: string;
  opening?: string;
  hints?: string[];
  examples?: string[];
};

export type ChatMessage = {
  id: number;
  role: "user" | "ai" | "sys";
  text: string;
};

export type PracticeFeedback = {
  summary: string;
  goals: { id: string; label: string; done: boolean }[];
  coaching: {
    good: string[];
    next: string[];
    examples: string[];
  };
  next: {
    retry_scenario: string;
    action: { id: string; title: string } | null;
    programs: { id: string; title: string }[];
  };
};
