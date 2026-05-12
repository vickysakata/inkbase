import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Settings, Search, PenLine } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InkBase - 智能文案素材检索",
  description: "面向文案编辑人员的个人文档素材库 AI 语义检索工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] bg-zinc-50 text-zinc-900 flex flex-col`}
      >
        <header className="sticky top-0 z-10 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 group transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
            >
              <div className="w-8 h-8 rounded-md bg-zinc-900 text-zinc-50 flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                I
              </div>
              <span className="font-medium tracking-tight text-lg text-zinc-900">
                InkBase
              </span>
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link 
                href="/" 
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded px-2 py-1"
              >
                <Search className="w-4 h-4" />
                <span>检索</span>
              </Link>
              <Link 
                href="/write" 
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded px-2 py-1"
              >
                <PenLine className="w-4 h-4" />
                <span>写点子</span>
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded px-2 py-1"
              >
                <Settings className="w-4 h-4" />
                <span>设置</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
