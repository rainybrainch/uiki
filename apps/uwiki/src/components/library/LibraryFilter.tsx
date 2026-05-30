"use client"

import Link from "next/link"
import clsx from "clsx"

type Props = {
  typeLabels: Record<string, string>
  typeCounts: Record<string, number>
  current: { type?: string; status?: string }
}

const STATUS_LABELS = [
  { id: undefined, label: "すべて" },
  { id: "WANT",    label: "積んでる" },
  { id: "DOING",   label: "進行中" },
  { id: "DONE",    label: "完了" },
]

export function LibraryFilter({ typeLabels, typeCounts, current }: Props) {
  const typeHref = (t?: string) => {
    const p = new URLSearchParams()
    if (t) p.set("type", t)
    if (current.status) p.set("status", current.status)
    const s = p.toString()
    return `/library${s ? "?" + s : ""}`
  }

  const statusHref = (s?: string) => {
    const p = new URLSearchParams()
    if (current.type) p.set("type", current.type)
    if (s) p.set("status", s)
    const qs = p.toString()
    return `/library${qs ? "?" + qs : ""}`
  }

  return (
    <div className="space-y-3">
      {/* タイプフィルター */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/library"
          className={clsx(
            "px-3 py-1 rounded-full text-xs border transition-all",
            !current.type
              ? "border-[var(--accent)] text-white bg-[rgba(58,111,201,0.2)]"
              : "border-[var(--border)] text-[var(--dim)] hover:border-[var(--accent)]"
          )}
        >
          すべて
        </Link>
        {Object.entries(typeLabels).map(([type, label]) => (
          <Link
            key={type}
            href={typeHref(type)}
            className={clsx(
              "px-3 py-1 rounded-full text-xs border transition-all",
              current.type === type
                ? "border-[var(--accent)] text-white bg-[rgba(58,111,201,0.2)]"
                : "border-[var(--border)] text-[var(--dim)] hover:border-[var(--accent)]"
            )}
          >
            {label}
            {typeCounts[type] > 0 && (
              <span className="ml-1.5" style={{ color: "var(--faint)" }}>
                {typeCounts[type]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ステータスフィルター */}
      <div className="flex gap-2">
        {STATUS_LABELS.map(({ id, label }) => (
          <Link
            key={label}
            href={statusHref(id)}
            className={clsx(
              "px-3 py-1 rounded-md text-xs transition-all",
              current.status === id
                ? "bg-[var(--accent-2)] text-white"
                : "text-[var(--dim)] hover:text-white hover:bg-[var(--faint)]"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
