"use client"

import Link from "next/link"
import { LayoutList, Kanban } from "lucide-react"
import clsx from "clsx"

export function ViewToggle({ current, projectFilter }: { current: string; projectFilter: string }) {
  const base = projectFilter !== "all" ? `?view=__&project=${projectFilter}` : `?view=__`
  const href = (v: string) => base.replace("__", v)

  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
    >
      <Link
        href={href("all")}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
          current !== "board" ? "bg-[var(--accent-2)] text-white" : "text-dim hover:text-white"
        )}
      >
        <LayoutList size={13} /> リスト
      </Link>
      <Link
        href={href("board")}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
          current === "board" ? "bg-[var(--accent-2)] text-white" : "text-dim hover:text-white"
        )}
      >
        <Kanban size={13} /> ボード
      </Link>
    </div>
  )
}
