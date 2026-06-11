import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Suspense } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { SessionProvider } from "@/components/layout/SessionProvider"
import { RainCanvas } from "@/components/layout/RainCanvas"
import { QuickSearch } from "@/components/search/QuickSearch"
import { KeyboardHelp } from "@/components/layout/KeyboardHelp"
import { SwRegister } from "@/components/layout/SwRegister"
import { prisma } from "@/lib/db"
import { getWeatherFromSettings } from "@/lib/weather"

export const metadata: Metadata = {
  title: "雨域 Uwiki",
  description: "静かな自己管理OS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "雨域",
  },
  other: { "mobile-web-app-capable": "yes" },
}

export const viewport: Viewport = {
  themeColor: "#060c1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let weather = null
  let rainIntensity = 0.35
  let overdueCount = 0
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
    weather = settings ? await getWeatherFromSettings(settings) : null
    rainIntensity = weather?.rainIntensity ?? 0.35
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    overdueCount = await prisma.task.count({
      where: { completed: false, parentTaskId: null, dueDate: { lt: todayStart } },
    })
  } catch (e) { console.error("[layout] error:", e) }

  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ background: "var(--bg)", minHeight: "100dvh", display: "flex", position: "relative" }}>
        <SessionProvider>
          <SwRegister />
          <RainCanvas intensity={rainIntensity} />
          <QuickSearch />
          <KeyboardHelp />

          {/* 全体レイアウト */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", width: "100%", minHeight: "100dvh" }}>

            {/* PCサイドバー */}
            <div className="hidden md:block">
              <Suspense fallback={<div style={{ width: 208, minHeight: "100vh", background: "rgba(4,8,18,0.96)", borderRight: "1px solid var(--border)" }} />}>
                <Sidebar weather={weather} overdueCount={overdueCount} />
              </Suspense>
            </div>

            {/* メインコンテンツ */}
            <main style={{
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              overflowX: "hidden",
              // スマホ: ボトムナビ分のパディング
              paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
            }}>
              <style>{`
                @media (min-width: 768px) { main { padding-bottom: 0 !important; } }
                /* コンテンツ幅の最大値（超広画面対応） */
                @media (min-width: 1920px) {
                  .page-wide { max-width: 1400px; margin-left: auto; margin-right: auto; }
                }
              `}</style>
              {children}
            </main>
          </div>

          {/* モバイルボトムナビ */}
          <Suspense fallback={null}>
            <MobileNav overdueCount={overdueCount} />
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  )
}
