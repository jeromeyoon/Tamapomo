import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PomoChi MVP0",
  description: "Solo pomodoro prototype for PomoChi"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
