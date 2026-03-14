import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/features/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ActivitySidebar } from "@/components/features/ActivitySidebar";

export const metadata: Metadata = {
  title: "DACON Platform - 해커톤 & 데이터 경진대회",
  description:
    "해커톤을 탐색하고, 팀을 모집하고, 결과물을 제출하는 데이터 경진대회 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className="min-h-screen bg-gray-50 font-sans antialiased dark:bg-gray-950"
      >
        <AuthProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <main className="flex-1 min-w-0">{children}</main>
                <ActivitySidebar />
              </div>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
