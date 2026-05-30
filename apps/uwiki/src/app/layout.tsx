import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import { RainCanvas } from "@/components/layout/RainCanvas"
import { QuickSearch } from "@/components/search/QuickSearch"
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
  themeColor: "#0a1530",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let weather = null
  let rainIntensity = 0.35
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
    weather = settings ? await getWeatherFromSettings(settings) : null
    rainIntensity = weather?.rainIntensity ?? 0.35
  } catch {
    // DB未接続時（初回デプロイ等）はデフォルト値で続行
  }

  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex relative" style={{ background: "var(--bg)" }}>
        <SwRegister />
        <RainCanvas intensity={rainIntensity} />
        <QuickSearch />

        <div className="relative z-10 flex w-full min-h-screen">
          {/* PCサイドバー（md以上のみ表示） */}
          <div className="hidden md:block">
            <Sidebar weather={weather} />
          </div>

          {/* メインコンテンツ（モバイルはボトムナビ分のパディング） */}
          <main
            className="flex-1 min-w-0 overflow-y-auto"
            style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom))" }}
          >
            <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
            {children}
          </main>
        </div>

        {/* モバイルボトムナビ */}
        <MobileNav />
      </body>
    </html>
  )
}
