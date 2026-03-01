import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team AI Hub - 79 AI Providers Collaboration Dashboard",
  description: "Multi-team AI collaboration dashboard with 79 AI providers support, voice input, secure API key management, and modern shadcn/ui interface.",
  keywords: ["AI", "Team Collaboration", "LLM", "OpenAI", "Anthropic", "Z.ai", "OpenCode", "Voice Input", "shadcn/ui", "Next.js"],
  authors: [{ name: "Team AI Hub" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Team AI Hub - AI Collaboration Dashboard",
    description: "Multi-team AI collaboration with 79 providers and secure voice-enabled interface",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
