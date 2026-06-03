"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard, CheckSquare, BookOpen, Repeat2,
  MoreHorizontal, X,
  CalendarDays, Library, BookMarked, BarChart2,
  Briefcase, Layers, Flame, Droplets, Settings2,
} from "lucide-react"
import { useState } from "react"

/* ─── プライマリナビ（常時表示 4つ + もっと） ─── */
const PRIMARY = [
  { href: "/",      label: "ホーム",  icon: LayoutDashboard },
  { href: "/tasks", label: "タスク",  icon: CheckSquare },
  { href: "/diary", label: "日記",    icon: BookOpen },
  { href: "/habits",label: "習慣",    icon: Repeat2 },
]

/* ─── もっとメニュー内の全ナビ ─── */
const MORE_NAV = [
  { href: "/calendar",              label: "カレンダー", icon: CalendarDays },
  { href: "/library",               label: "ライブラリ", icon: Library },
  { href: "/yomu",                  label: "読雨",       icon: BookMarked,  color: "#3a6fc9" },
  { href: "/report",                label: "レポート",   icon: BarChart2 },
  { href: "/cases",                 label: "案件",       icon: Briefcase,   color: "#c9a84c" },
  { href: "/dreams",                label: "百層世界",   icon: Layers,      color: "#8b5cf6" },
  { href: "/gravity?tab=internal",  label: "重力雨域",   icon: Flame,       color: "#c9a84c" },
  { href: "/gravity?tab=external",  label: "引力雨域",   icon: Droplets,    color: "#3a6fc9" },
  { href: "/settings",              label: "設定",       icon: Settings2 },
]

export function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

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

  const isMoreActive = MORE_NAV.some((n) => isActive(n.href))

  return (
    <>
      {/* ボトムシート オーバーレイ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* もっとメニュー ボトムシート */}
      <div
        style={{
          position: "fixed",
          bottom: open ? 0 : "-100%",
          left: 0, right: 0,
          zIndex: 50,
          background: "rgba(6,10,24,0.98)",
          borderTop: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          padding: "12px 20px calc(72px + env(safe-area-inset-bottom)) 20px",
          transition: "bottom 0.3s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* ハンドル */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--dim)", letterSpacing: "0.05em" }}>すべてのページ</span>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dim)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ナビグリッド */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {MORE_NAV.map(({ href, label, icon: Icon, color }) => {
            const active = isActive(href)
            const c = color ?? "var(--accent)"
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 6, padding: "14px 8px",
                  borderRadius: 12, textDecoration: "none",
                  background: active ? `${c}15` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? `${c}35` : "var(--border)"}`,
                  color: active ? "white" : "var(--dim)",
                  fontSize: "0.7rem",
                  transition: "background 0.15s",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} style={{ color: active ? c : "inherit" }} />
                <span style={{ whiteSpace: "nowrap" }}>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ボトムナビ本体 */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 35,
          display: "flex",
          background: "rgba(4,8,18,0.97)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(24px)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "10px 0",
                textDecoration: "none",
                color: active ? "white" : "var(--dim)",
                fontSize: "0.62rem", minHeight: 56,
                transition: "color 0.12s",
                position: "relative",
              }}
            >
              {/* アクティブ indicator */}
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 24, height: 2.5, borderRadius: "0 0 3px 3px",
                  background: "var(--accent)",
                }} />
              )}
              <Icon size={20} strokeWidth={active ? 2.2 : 1.5}
                style={{ color: active ? "var(--accent)" : "inherit", transition: "color 0.12s" }} />
              {label}
            </Link>
          )
        })}

        {/* もっとボタン */}
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 3, padding: "10px 0", minHeight: 56,
            background: "none", border: "none", cursor: "pointer",
            color: isMoreActive || open ? "white" : "var(--dim)",
            fontSize: "0.62rem", transition: "color 0.12s",
          }}
        >
          {open
            ? <X size={20} style={{ color: "var(--accent)" }} />
            : <MoreHorizontal size={20} strokeWidth={1.5} style={{ color: isMoreActive ? "var(--accent)" : "inherit" }} />
          }
          もっと
        </button>
      </nav>
    </>
  )
}
