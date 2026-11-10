import { test, expect } from "@playwright/test";

test("편의점 상황: 사용자 선발화 → 서버 응답 → 피드백", async ({ page }) => {
  await page.goto("/");

  // 백엔드가 연결된 실제 시나리오 목록으로 전환되기를 기다립니다.
  await expect(page.locator(".connection-pill")).toContainText("서버 연결");
  await expect(page.getByText("전체 6개")).toBeVisible();

  await page.getByRole("button", { name: /연습 살펴보기/ }).first().click();
  await expect(page.getByRole("heading", { name: "편의점에서 물건 위치 물어보기" })).toBeVisible();

  await page.getByRole("button", { name: /연습 시작하기/ }).click();
  await expect(page.getByRole("heading", { name: "편의점에서 물건 위치 물어보기" })).toBeVisible();

  // 실제 직원은 먼저 말을 걸지 않고 사용자가 시작할 때까지 기다립니다.
  await expect(page.locator(".message-line.ai")).toHaveCount(0);

  await page.getByRole("textbox", { name: "대화 메시지 입력" }).fill("저기요, 혹시 컵라면은 어디에 있나요?");
  await page.getByRole("button", { name: "메시지 보내기" }).click();

  await expect(page.locator(".message-line.user .message-bubble")).toHaveText("저기요, 혹시 컵라면은 어디에 있나요?");
  await expect(page.locator(".message-line.ai .message-bubble")).toContainText("라면은 안쪽 오른편 진열대에 있어요.");
  await expect(page.locator(".connection-pill")).toContainText("규칙 기반 응답");

  await page.getByRole("textbox", { name: "대화 메시지 입력" }).fill("감사합니다.");
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(page.locator(".message-line.ai .message-bubble").last()).toContainText("좋은 하루 보내세요.");

  await page.getByRole("button", { name: "연습 마치기" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "연습 마치기" }).click();

  await expect(page.locator(".result-summary")).toContainText("2번");
  await expect(page.locator(".result-goals")).toContainText("필요한 정보 물어보기");
  await expect(page.getByText(/현재 피드백은 발화의 키워드를 기준으로/)).toBeVisible();
});

test("연습 중 힌트와 일시정지가 정상 작동한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".connection-pill")).toContainText("서버 연결");
  await page.getByRole("button", { name: /연습 살펴보기/ }).first().click();
  await page.getByRole("button", { name: /연습 시작하기/ }).click();

  await page.getByRole("button", { name: "힌트 보기" }).click();
  await page.getByRole("button", { name: "힌트 받기" }).click();
  await expect(page.locator(".hint-message")).toContainText("저기요");

  await page.getByRole("button", { name: "잠시 쉬어가기" }).click();
  await expect(page.getByRole("textbox", { name: "대화 메시지 입력" })).toBeDisabled();
  await page.getByRole("button", { name: "다시 이어하기" }).click();
  await expect(page.getByRole("textbox", { name: "대화 메시지 입력" })).toBeEnabled();
});
