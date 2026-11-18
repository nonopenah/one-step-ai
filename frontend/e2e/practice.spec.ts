import { test, expect } from "@playwright/test";

async function startStorePractice(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /오늘은 어디서/ })).toBeVisible();
  await page.getByRole("navigation", { name: "메인 메뉴" }).getByRole("button", { name: "AI 상황 연습" }).click();
  await expect(page.getByText("6개", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /편의점에서 물건 위치 물어보기/ }).click();
  await expect(page.getByRole("heading", { name: "이런 상황을 연습해요." })).toBeVisible();
  await page.getByRole("button", { name: "연습 시작하기" }).click();
  await expect(page.getByRole("heading", { name: "편의점에서 물건 위치 물어보기" })).toBeVisible();
}

test("홈 → 상황 선택 → 사용자 선발화 → 피드백 → 기록", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("서버 연결 · 규칙 응답")).toBeVisible();
  await startStorePractice(page);
  await expect(page.locator(".chat-row--ai")).toHaveCount(0);

  await page.getByRole("textbox", { name: "대화 메시지 입력" }).fill("저기요, 혹시 컵라면은 어디에 있나요?");
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(page.locator(".chat-row--user .chat-bubble")).toContainText("저기요, 혹시 컵라면은 어디에 있나요?");
  await expect(page.locator(".chat-row--ai .chat-bubble")).toContainText("라면은 안쪽 오른편 진열대에 있어요.");
  await page.getByRole("textbox", { name: "대화 메시지 입력" }).fill("감사합니다.");
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(page.locator(".chat-row--ai .chat-bubble").last()).toContainText("좋은 하루 보내세요.");

  await page.getByRole("button", { name: "마치기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "연습 마치기" }).click();
  await expect(page.getByRole("heading", { name: "연습을 마쳤어요." })).toBeVisible();
  await expect(page.locator(".goal-list")).toContainText("필요한 정보 물어보기");
  await expect(page.getByText(/키워드에 기반한 참고용 정보/)).toBeVisible();

  await page.getByRole("button", { name: "말 시작하기" }).click();
  await page.getByRole("button", { name: "나의 기록 보기" }).click();
  await expect(page.getByRole("heading", { name: "나의 기록" })).toBeVisible();
  await expect(page.getByText("어려웠던 부분: 말 시작하기")).toBeVisible();
});

test("연습 중 힌트와 쉬어가기 기능", async ({ page }) => {
  await startStorePractice(page);
  await page.getByRole("button", { name: "힌트", exact: true }).click();
  await page.getByRole("button", { name: "힌트 받기" }).click();
  await expect(page.locator(".chat-hint")).toContainText("저기요");
  await page.getByRole("button", { name: "쉬어가기" }).click();
  await expect(page.getByRole("textbox", { name: "대화 메시지 입력" })).toBeDisabled();
  await page.getByRole("button", { name: "이어하기" }).click();
  await expect(page.getByRole("textbox", { name: "대화 메시지 입력" })).toBeEnabled();
});

test("첫 화면에서 선택적 관심 주제를 바꿀 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "간단히 선택하기" }).click();
  await page.getByRole("button", { name: "대인관계" }).click();
  await expect(page.getByText("선택한 관심 주제")).toBeVisible();
  await expect(page.getByRole("heading", { name: /처음 만난 사람과 인사하기/ })).toBeVisible();
});
