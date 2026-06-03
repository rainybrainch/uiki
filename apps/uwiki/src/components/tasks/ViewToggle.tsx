"use client"

import Link from "next/link"
import { LayoutList, Kanban, GitBranch } from "lucide-react"
import clsx from "clsx"

export function ViewToggle({ current, projectFilter }: { current: string; projectFilter: string }) {
  const base = projectFilter !== "all" ? `?view=__&project=${projectFilter}` : `?view=__`
  const href = (v: string) => base.replace("__", v)

  const tabs = [
    { id: "all",   icon: <LayoutList size={13} />, label: "リスト" },
    { id: "board", icon: <Kanban size={13} />,     label: "ボード" },
    { id: "flow",  icon: <GitBranch size={13} />,  label: "フロー" },
  ]

  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
    >
      {tabs.map(({ id, icon, label }) => (
        <Link key={id} href={href(id)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
            current === id ? "bg-[var(--accent-2)] text-white" : "text-dim hover:text-white"
          )}
        >
          {icon} {label}
        </Link>
      ))}
    </div>
  )
}
