"use client"

import { useTransition } from "react"
import { updateLibraryItem, deleteLibraryItem } from "@/actions/library"
import { ExternalLink, Star, Trash2 } from "lucide-react"
import clsx from "clsx"
import type { ItemStatus } from "@ameiki/database"

type Item = {
  id: string
  type: string
  title: string
  creator: string | null
  url: string | null
  coverUrl: string | null
  status: ItemStatus
  rating: number | null
  note: string | null
  tags: string | null
  finishedAt: string | null
}

const STATUS_LABELS: Record<ItemStatus, { label: string; color: string }> = {
  WANT:  { label: "積んでる", color: "var(--dim)" },
  DOING: { label: "進行中",   color: "var(--accent)" },
  DONE:  { label: "完了",     color: "#4ade80" },
}

export function LibraryList({ items, typeLabels }: { items: Item[]; typeLabels: Record<string, string> }) {
  if (items.length === 0) {
    return (
      <p className="text-center py-16 text-sm" style={{ color: "var(--faint)" }}>
        アイテムを追加してください
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} typeLabels={typeLabels} />
      ))}
    </div>
  )
}

function LibraryCard({ item, typeLabels }: { item: Item; typeLabels: Record<string, string> }) {
  const [pending, startTransition] = useTransition()

  const cycleStatus = () => {
    const next: Record<ItemStatus, ItemStatus> = { WANT: "DOING", DOING: "DONE", DONE: "WANT" }
    startTransition(() => updateLibraryItem(item.id, { status: next[item.status] }))
  }

  const setRating = (r: number) => {
    startTransition(() => updateLibraryItem(item.id, { rating: r === item.rating ? null : r }))
  }

  const statusInfo = STATUS_LABELS[item.status]

  return (
    <div
      className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--faint)]"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* タイプアイコン */}
      <div
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg"
        style={{ background: "rgba(58,111,201,0.1)" }}
      >
        {typeLabels[item.type]?.slice(0, 2) ?? "◉"}
      </div>

      {/* メイン情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
            {item.creator && (
              <p className="text-xs mt-0.5" style={{ color: "var(--dim)" }}>{item.creator}</p>
            )}
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1 rounded hover:bg-[var(--faint)] transition-colors"
              style={{ color: "var(--dim)" }}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {item.note && (
          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--dim)" }}>
            {item.note}
          </p>
        )}

        {/* 星評価 (完了時のみ) */}
        {item.status === "DONE" && (
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                disabled={pending}
                className="transition-all"
              >
                <Star
                  size={13}
                  fill={item.rating && n <= item.rating ? "#f59e0b" : "none"}
                  stroke={item.rating && n <= item.rating ? "#f59e0b" : "var(--faint)"}
                />
              </button>
            ))}
          </div>
        )}

        {/* タグ */}
        {item.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.split(",").map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)" }}
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ステータスと操作 */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={cycleStatus}
          disabled={pending}
          className="text-[10px] px-2 py-1 rounded-full border transition-all hover:opacity-80"
          style={{ borderColor: statusInfo.color, color: statusInfo.color }}
        >
          {statusInfo.label}
        </button>
        <button
          onClick={() => startTransition(() => deleteLibraryItem(item.id))}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--faint)]"
          style={{ color: "var(--dim)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
