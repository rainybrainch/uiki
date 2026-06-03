"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard, CheckSquare, Repeat2, BookOpen,
  Library, Settings2, CalendarDays, BarChart2, Flame, Droplets,
} from "lucide-react"
import clsx from "clsx"
import type { WeatherData } from "@/lib/weather"

const nav = [
  { href: "/",                      label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/tasks",                 label: "タスク",         icon: CheckSquare },
  { href: "/calendar",              label: "カレンダー",     icon: CalendarDays },
  { href: "/habits",                label: "習慣",           icon: Repeat2 },
  { href: "/diary",                 label: "日記",           icon: BookOpen },
  { href: "/library",               label: "ライブラリ",     icon: Library },
  { href: "/report",                label: "レポート",       icon: BarChart2 },
  { href: "/gravity?tab=internal",  label: "重力雨域",       icon: Flame,    color: "#c9a84c" },
  { href: "/gravity?tab=external",  label: "引力雨域",       icon: Droplets, color: "#3a6fc9" },
]

export function Sidebar({ weather }: { weather: WeatherData | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    const [path, query] = href.split("?")
    if (!pathname.startsWith(path)) return false
    if (query) {
      const [key, val] = query.split("=")
      return searchParams.get(key) === val
    }
    return true
  }

  return (
    <aside
      className="relative flex flex-col w-52 min-h-screen shrink-0"
      style={{
        background: "rgba(4, 8, 18, 0.92)",
        borderRight: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ブランド */}
      <div className="px-5 pt-7 pb-5">
        <Link href="/">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl tracking-[0.2em]" style={{ color: "var(--accent)" }}>雨域</span>
            <span className="text-xs tracking-widest text-dim">Uwiki</span>
          </div>
        </Link>
        <button
          className="mt-3 w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-dim transition-colors hover:text-white hover:bg-[var(--faint)]"
          style={{ border: "1px solid var(--border)" }}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
            window.dispatchEvent(e)
          }}
        >
          <span className="flex-1 text-left">検索...</span>
          <kbd className="text-[9px] px-1 rounded" style={{ background: "var(--faint)" }}>⌘K</kbd>
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, color }) => {
          const active = isActive(href)
          const accentColor = color ?? "var(--accent)"
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150",
                active ? "font-medium" : "text-dim hover:text-white"
              )}
              style={active ? {
                color: "white",
                background: color ? `${color}22` : "rgba(36,86,184,0.18)",
                border: `1px solid ${color ? `${color}44` : "rgba(58,111,201,0.28)"}`,
              } : { border: "1px solid transparent" }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? accentColor : "inherit" }} />
              {label}
            </Link>
          )
        })}
      </nav>

      <WeatherWidget weather={weather} />

      <div className="px-2 pb-2">
        {(() => {
          const active = pathname === "/settings"
          return (
            <Link
              href="/settings"
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all",
                active ? "font-medium" : "text-dim hover:text-white"
              )}
              style={active ? {
                color: "white", background: "rgba(36,86,184,0.18)",
                border: "1px solid rgba(58,111,201,0.28)",
              } : { border: "1px solid transparent" }}
            >
              <Settings2 size={15} strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? "var(--accent)" : "inherit" }} />
              設定
            </Link>
          )
        })()}
      </div>

      <div className="px-5 pb-3">
        <p className="text-[9px] font-mono text-faint tracking-widest">v0.4.0</p>
      </div>
    </aside>
  )
}

function WeatherWidget({ weather }: { weather: WeatherData | null }) {
  const icon = !weather ? "🌧"
    : weather.weatherCode === 0 ? "☀️"
    : weather.weatherCode <= 3 ? "⛅"
    : weather.weatherCode <= 48 ? "🌫"
    : weather.weatherCode <= 67 ? "🌧"
    : weather.weatherCode <= 77 ? "❄️"
    : weather.weatherCode <= 82 ? "🌦"
    : "⛈"

  return (
    <div className="mx-3 mb-2 px-3 py-3 rounded-xl" style={{
      background: "rgba(58,111,201,0.05)",
      border: "1px solid rgba(58,111,201,0.1)",
    }}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl leading-none">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>
              {weather?.description ?? "雨が降っている"}
            </p>
            {weather && <p className="text-[10px] font-mono text-dim">{weather.temperature}°C</p>}
          </div>
          {weather
            ? <p className="text-[9px] text-faint truncate">{weather.city}</p>
            : <Link href="/settings" className="text-[9px] text-faint hover:text-dim">都市を設定する →</Link>
          }
        </div>
      </div>
      {weather && weather.precipitation > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min(100, weather.rainIntensity * 100)}%`,
              background: "var(--accent)",
            }} />
          </div>
          <span className="text-[9px] font-mono text-faint">{weather.precipitation}mm</span>
        </div>
      )}
    </div>
  )
}
