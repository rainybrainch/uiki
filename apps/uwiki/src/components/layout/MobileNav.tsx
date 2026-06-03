"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, CheckSquare, Repeat2, Flame, Droplets, Briefcase } from "lucide-react"

const nav = [
  { href: "/",                     label: "ホーム",  icon: LayoutDashboard, color: null },
  { href: "/tasks",                label: "タスク",  icon: CheckSquare,     color: null },
  { href: "/cases",                label: "案件",    icon: Briefcase,       color: "#c9a84c" },
  { href: "/gravity?tab=internal", label: "重力",    icon: Flame,           color: "#c9a84c" },
  { href: "/gravity?tab=external", label: "引力",    icon: Droplets,        color: "#3a6fc9" },
]

export function MobileNav() {
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
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 30,
        display: "flex",
        background: "rgba(4,8,18,0.97)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {nav.map(({ href, label, icon: Icon, color }) => {
        const active = isActive(href)
        const activeColor = color ?? "var(--accent)"
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "10px 0",
              textDecoration: "none",
              color: active ? "white" : "var(--dim)",
              fontSize: "0.62rem",
              letterSpacing: "0.02em",
              transition: "color 0.15s",
              minHeight: 52,
            }}
          >
            <Icon
              size={19}
              strokeWidth={active ? 2.2 : 1.5}
              style={{
                color: active ? activeColor : "inherit",
                transition: "color 0.15s",
              }}
            />
            <span style={{ lineHeight: 1 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
