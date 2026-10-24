import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team AI Hub - Next-Gen AI Collaboration & Agent Orchestration",
  description: "Empowering team productivity with intelligent multi-agent orchestration, seamless workflow automation, real-time observability, and AI collaboration.",
  keywords: ["AI", "Team Collaboration", "LLM", "Agent Orchestration", "Workflow Automation", "OpenAI", "Anthropic", "Z.ai", "shadcn/ui", "Next.js"],
  authors: [{ name: "Team AI Hub" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Team AI Hub - AI Collaboration & Orchestration",
    description: "Empowering team productivity with intelligent multi-agent orchestration and voice-enabled collaboration.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
