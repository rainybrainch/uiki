"use client"

import { format, subDays, eachDayOfInterval, startOfWeek } from "date-fns"
import { ja } from "date-fns/locale"
import { calcStreak } from "@/lib/date"

type Props = { logDates: string[]; color: string; name: string }

const WEEKS = 15

export function HabitHeatmap({ logDates, color, name }: Props) {
  const today = new Date()
  const startDate = startOfWeek(subDays(today, WEEKS * 7), { locale: ja })

  const days = eachDayOfInterval({ start: startDate, end: today })
  const dateSet = new Set(logDates)

  const weeks: Date[][] = []
  let week: Date[] = []
  for (const d of days) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) weeks.push(week)

  const totalDays = days.length
  const doneDays = days.filter((d) => dateSet.has(format(d, "yyyy-MM-dd"))).length
  const streak = calcStreak(logDates)  // lib/date.ts の統一実装を使用

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono text-dim">{doneDays}/{totalDays} 日達成</p>
        {streak > 0 && (
          <p className="text-xs font-mono" style={{ color }}>🌧 {streak}日連続</p>
        )}
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {w.map((d) => {
              const ds = format(d, "yyyy-MM-dd")
              const done = dateSet.has(ds)
              return (
                <div
                  key={ds}
                  className="w-3 h-3 rounded-sm transition-all"
                  style={{
                    background: done ? color : "rgba(255,255,255,0.06)",
                    opacity: done ? 0.85 : 1,
                  }}
                  title={`${format(d, "M/d")}${done ? " ✓" : ""}`}
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
