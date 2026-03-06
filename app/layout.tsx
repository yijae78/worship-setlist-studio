import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "찬양콘티 스튜디오",
  description: "주제와 성경본문 기반 찬양콘티 설계 도구"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
