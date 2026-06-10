"use client"

import { format, subDays, eachDayOfInterval, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import { calcStreak, calcBestStreak } from "@/lib/date"

type Props = { logDates: string[]; color: string; name: string; createdAt?: Date | string }

const WEEKS = 8

export function HabitHeatmap({ logDates, color, name, createdAt }: Props) {
  const today = new Date()
  const startDate = startOfWeek(subDays(today, WEEKS * 7), { locale: ja })

  const days = eachDayOfInterval({ start: startDate, end: today })
  const dateSet = new Set(logDates)

  // 作成日（ローカル日付文字列）
  const createdDateStr = createdAt
    ? format(new Date(createdAt), "yyyy-MM-dd")
    : null

  const weeks: Date[][] = []
  let week: Date[] = []
  for (const d of days) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) weeks.push(week)

  // 作成日以降の日数のみカウント
  const activeDays = days.filter((d) => {
    const ds = format(d, "yyyy-MM-dd")
    return !createdDateStr || ds >= createdDateStr
  })
  const totalDays = activeDays.length
  const doneDays = activeDays.filter((d) => dateSet.has(format(d, "yyyy-MM-dd"))).length
  const streak = calcStreak(logDates)
  const bestStreak = calcBestStreak(logDates)
  const pct = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-mono text-dim">{doneDays}/{totalDays} 日達成</p>
          {totalDays > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: pct >= 80 ? `${color}18` : "rgba(255,255,255,0.04)",
                color: pct >= 80 ? color : "var(--faint)",
              }}>
              {pct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {bestStreak > 1 && streak !== bestStreak && (
            <p className="text-[10px] font-mono text-faint">最長 {bestStreak}日</p>
          )}
          {streak > 0 && (
            <p className="text-xs font-mono" style={{ color }}>🌧 {streak}日連続</p>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {w.map((d) => {
              const ds = format(d, "yyyy-MM-dd")
              const done = dateSet.has(ds)
              const beforeCreation = createdDateStr && ds < createdDateStr
              return (
                <div
                  key={ds}
                  className="w-3 h-3 rounded-sm transition-all"
                  style={{
                    background: beforeCreation
                      ? "transparent"
                      : done ? color : "rgba(255,255,255,0.06)",
                    opacity: beforeCreation ? 0.2 : done ? 0.85 : 1,
                    border: beforeCreation ? "1px dashed rgba(255,255,255,0.08)" : "none",
                  }}
                  title={beforeCreation
                    ? `${format(d, "M/d")} (習慣作成前)`
                    : `${format(d, "M/d")}${done ? " ✓" : ""}`}
                  aria-label={beforeCreation
                    ? `${format(d, "M月d日", { locale: ja })} 作成前`
                    : `${format(d, "M月d日", { locale: ja })} ${done ? "達成" : "未達成"}`}
                  role="img"
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* 月ラベル */}
      <div className="flex gap-0.5 mt-1 overflow-x-auto">
        {weeks.map((w, wi) => {
          const first = w[0]
          const showLabel = first && (parseInt(format(first, "d"), 10) <= 7 || wi === 0)
          return (
            <div key={wi} className="w-3 shrink-0">
              {showLabel && (
                <p className="text-[8px] font-mono text-faint" style={{ fontSize: "7px" }}>
                  {format(first, "M")}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
