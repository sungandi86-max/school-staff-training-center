import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "학교 교직원 교육센터",
  description: "School Staff Training Center"
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
