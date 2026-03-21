import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/features/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ActivitySidebar } from "@/components/features/ActivitySidebar";
import { NavigationSidebar } from "@/components/features/NavigationSidebar";
import { ServiceWorkerRegistrar } from "@/components/features/ServiceWorkerRegistrar";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "CodeArena - 해커톤 & 데이터 경진대회 플랫폼",
  description:
    "해커톤을 탐색하고, 팀을 모집하고, 결과물을 제출하는 데이터 경진대회 플랫폼입니다.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CodeArena Platform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect to font origin for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Fonts: Syne (display) + Noto Sans KR (body) + Space Mono (code) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Preload critical Noto Sans KR for LCP */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
          as="style"
        />
        {/* DNS prefetch for any external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className="min-h-screen bg-slate-50 font-body antialiased dark:bg-slate-950"
      >
        <ServiceWorkerRegistrar />
        <AuthProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <NavigationSidebar />
                <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
                <ActivitySidebar />
              </div>
              <Footer />
              <BottomNav />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
