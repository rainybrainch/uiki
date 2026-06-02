"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CheckSquare, Repeat2, BookOpen, Library } from "lucide-react"
import clsx from "clsx"

const nav = [
  { href: "/",        label: "ホーム", icon: LayoutDashboard },
  { href: "/tasks",   label: "タスク", icon: CheckSquare },
  { href: "/habits",  label: "習慣",   icon: Repeat2 },
  { href: "/diary",   label: "日記",   icon: BookOpen },
  { href: "/library", label: "本棚",   icon: Library },
]

export function MobileNav() {
  const pathname = usePathname()

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
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-all",
              active ? "text-white" : "text-dim"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.5} style={{ color: active ? "var(--accent)" : "inherit" }} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
