"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

type Props = {
  name: string
  subject: string
  summary: string | null
  snippet: string
  relativeTime: string
  acColor: string
  catColor: string
  catLabel: string | null
  isHigh: boolean
  isUnread: boolean
}

export function MailItem({
  name, subject, summary, snippet,
  relativeTime, acColor, catColor, catLabel,
  isHigh, isUnread,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl p-3 transition-colors"
      style={{
        background: isHigh ? "rgba(248,113,113,0.06)" : isUnread ? `${acColor}08` : "transparent",
        border: `1px solid ${isHigh ? "rgba(248,113,113,0.25)" : isUnread ? `${acColor}20` : "var(--border)"}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* アカウントカラードット */}
        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
          style={{ background: acColor, opacity: isUnread ? 1 : 0.35 }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              {isHigh && (
                <span className="text-[9px] font-bold shrink-0" style={{ color: "#f87171" }}>!!!</span>
              )}
              <span className={`text-xs truncate ${isUnread ? "font-medium" : "text-dim"}`}>{name}</span>
              {catLabel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: `${catColor}18`, color: catColor }}>
                  {catLabel}
                </span>
              )}
            </div>
            <span className="text-[10px] text-faint shrink-0">{relativeTime}</span>
          </div>

          <p className={`text-sm mb-0.5 truncate ${isUnread ? "font-medium" : "text-dim"}`}>
            {subject}
          </p>

          {/* AI要約 */}
          {summary ? (
            <p className="text-[11px] leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>
              {summary}
            </p>
          ) : (
            <p className="text-[11px] text-faint line-clamp-1 mb-1">{snippet}</p>
          )}

          {/* 元の内容トグル */}
          {summary && snippet && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-faint hover:text-dim transition-colors mt-0.5"
            >
              <ChevronDown
                size={11}
                className="transition-transform duration-200"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              />
              {open ? "元の内容を隠す" : "元の内容を見る"}
            </button>
          )}

          {open && (
            <div
              className="mt-2 p-2.5 rounded-lg text-[11px] leading-relaxed text-faint"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
            >
              {snippet}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
