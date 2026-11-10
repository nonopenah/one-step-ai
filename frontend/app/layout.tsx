import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한걸음 | 나의 속도로 연습하는 대화",
  description: "부담 없이 사회적 상황을 연습하는 AI 대화 공간",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
