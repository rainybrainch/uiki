"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, CheckSquare, Repeat2, Flame, Droplets } from "lucide-react"
import clsx from "clsx"

const nav = [
  { href: "/",                     label: "ホーム",   icon: LayoutDashboard, color: null },
  { href: "/tasks",                label: "タスク",   icon: CheckSquare,     color: null },
  { href: "/habits",               label: "習慣",     icon: Repeat2,         color: null },
  { href: "/gravity?tab=internal", label: "重力",     icon: Flame,           color: "#c9a84c" },
  { href: "/gravity?tab=external", label: "引力",     icon: Droplets,        color: "#3a6fc9" },
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
      className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
      style={{
        background: "rgba(4,8,18,0.95)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
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
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-all",
              active ? "text-white" : "text-dim"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.5}
              style={{ color: active ? activeColor : "inherit" }} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
