"use client"

import { yomuDateToIso } from "@/lib/yomu"
import type { YomuEntry } from "@/lib/yomu"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

const RANK_COLORS: Record<string, string> = {
  S: "#f5c518", "A+": "#4ade80", A: "#4ade80",
  "B+": "#3a6fc9", B: "#3a6fc9", "C+": "#c9a84c",
  C: "#c9a84c", D: "#f87171",
}

export function YomuBodyScan({ entry }: { entry: YomuEntry }) {
  const rank = entry.rank ?? "—"
  const color = RANK_COLORS[rank] ?? "var(--dim)"
  const dateStr = yomuDateToIso(entry.date)

  return (
    <div className="surface rounded-xl p-4 flex items-start gap-4">
      {entry.image_url && (
        <img
          src={entry.image_url}
          alt="body scan"
          style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "0.4rem", flexShrink: 0 }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-lg font-serif font-bold"
            style={{ color }}
          >
            {rank}
          </span>
          <span className="text-xs font-mono text-dim">
            {format(parseISO(dateStr), "M月d日", { locale: ja })}
          </span>
        </div>
        {entry.memo && (
          <p className="text-xs text-dim line-clamp-2">{entry.memo}</p>
        )}
      </div>
    </div>
  )
}
