"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard, CheckSquare, Repeat2, BookOpen,
  Library, Settings2, CalendarDays, BarChart2,
  Flame, Droplets, BookMarked, Briefcase, Layers, ChevronLeft, ChevronRight,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { WeatherData } from "@/lib/weather"

const nav = [
  { href: "/",                     label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/tasks",                label: "タスク",         icon: CheckSquare },
  { href: "/calendar",             label: "カレンダー",     icon: CalendarDays },
  { href: "/habits",               label: "習慣",           icon: Repeat2 },
  { href: "/diary",                label: "日記",           icon: BookOpen },
  { href: "/library",              label: "ライブラリ",     icon: Library },
  { href: "/yomu",                 label: "読雨",           icon: BookMarked, color: "#3a6fc9" },
  { href: "/report",               label: "レポート",       icon: BarChart2 },
  null,
  { href: "/cases",                label: "案件",           icon: Briefcase, color: "#c9a84c" },
  { href: "/dreams",               label: "百層世界",       icon: Layers,    color: "#8b5cf6" },
  null,
  { href: "/gravity?tab=internal", label: "重力雨域",       icon: Flame,     color: "#c9a84c" },
  { href: "/gravity?tab=external", label: "引力雨域",       icon: Droplets,  color: "#3a6fc9" },
]

export function Sidebar({ weather }: { weather: WeatherData | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(stored === "true")
    else if (window.innerWidth < 1280) setCollapsed(true)
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

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

  const w = mounted ? (collapsed ? 56 : 208) : 208

  return (
    <aside
      style={{
        width: w,
        minHeight: "100vh",
        background: "rgba(4,8,18,0.96)",
        borderRight: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        transition: mounted ? "width 0.22s cubic-bezier(0.4,0,0.2,1)" : "none",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* ブランド */}
      <div style={{ padding: collapsed ? "24px 0 16px" : "24px 16px 16px", overflow: "hidden", minHeight: 72 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", justifyContent: collapsed ? "center" : "flex-start", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "'Noto Serif JP',serif", fontSize: collapsed ? "1.2rem" : "1.4rem", color: "var(--accent)", letterSpacing: "0.2em", whiteSpace: "nowrap" }}>
            {collapsed ? "雨" : "雨域"}
          </span>
          {!collapsed && (
            <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--dim)", whiteSpace: "nowrap" }}>Uwiki</span>
          )}
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav style={{ flex: 1, padding: "0 6px", overflowY: "auto", overflowX: "hidden" }}>
        {nav.map((item, i) => {
          if (item === null) {
            return <div key={`div-${i}`} style={{ height: 1, background: "var(--border)", margin: "4px 4px 4px" }} />
          }
          const { href, label, icon: Icon, color } = item
          const active = isActive(href)
          const accentColor = color ?? "var(--accent)"

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "9px 0" : "8px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8,
                marginBottom: 1,
                fontSize: "0.8125rem",
                textDecoration: "none",
                transition: "background 0.12s, color 0.12s",
                background: active ? (color ? `${color}18` : "rgba(36,86,184,0.18)") : "transparent",
                border: `1px solid ${active ? (color ? `${color}30` : "rgba(58,111,201,0.25)") : "transparent"}`,
                color: active ? "white" : "var(--dim)",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)" } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--dim)" } }}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} style={{ color: active ? accentColor : "inherit", flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", opacity: mounted ? 1 : 1 }}>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 天気 */}
      {!collapsed && <WeatherWidget weather={weather} />}

      {/* 設定 */}
      <div style={{ padding: "0 6px 6px" }}>
        {(() => {
          const active = pathname === "/settings"
          return (
            <Link href="/settings" title={collapsed ? "設定" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                padding: collapsed ? "9px 0" : "8px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 8, marginBottom: 2,
                fontSize: "0.8125rem", textDecoration: "none",
                background: active ? "rgba(36,86,184,0.18)" : "transparent",
                border: `1px solid ${active ? "rgba(58,111,201,0.25)" : "transparent"}`,
                color: active ? "white" : "var(--dim)",
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)" } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--dim)" } }}
            >
              <Settings2 size={15} strokeWidth={active ? 2 : 1.5} style={{ color: active ? "var(--accent)" : "inherit", flexShrink: 0 }} />
              {!collapsed && <span>設定</span>}
            </Link>
          )
        })()}

        {/* 折りたたみ */}
        <button onClick={toggle}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "7px 0" : "5px 10px",
            background: "transparent", border: "none",
            borderRadius: 8, cursor: "pointer",
            color: "var(--faint)", transition: "color 0.12s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--dim)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--faint)"}
        >
          {!collapsed && <span style={{ fontSize: "0.6rem", fontFamily: "monospace" }}>v0.6</span>}
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
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
    <div style={{ margin: "0 8px 6px", padding: "10px 12px", borderRadius: 10, background: "rgba(58,111,201,0.05)", border: "1px solid rgba(58,111,201,0.1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{icon}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--accent)", margin: 0 }}>{weather?.description ?? "雨が降っている"}</p>
            {weather && <p style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "var(--dim)", margin: 0 }}>{weather.temperature}°C</p>}
          </div>
          {weather
            ? <p style={{ fontSize: "0.58rem", color: "var(--faint)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{weather.city}</p>
            : <Link href="/settings" style={{ fontSize: "0.58rem", color: "var(--faint)", textDecoration: "none" }}>都市を設定 →</Link>
          }
        </div>
      </div>
      {weather?.precipitation != null && weather.precipitation > 0 && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ height: "100%", borderRadius: 1, width: `${Math.min(100, weather.rainIntensity * 100)}%`, background: "var(--accent)" }} />
          </div>
          <span style={{ fontSize: "0.58rem", fontFamily: "monospace", color: "var(--faint)" }}>{weather.precipitation}mm</span>
        </div>
      )}
    </div>
  )
}
