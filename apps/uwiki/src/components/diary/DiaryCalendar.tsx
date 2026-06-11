"use client"

import { useRouter } from "next/navigation"
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import clsx from "clsx"
import { isToday as dateFnsIsToday } from "date-fns"

const MOOD_COLORS: Record<number, string> = {
  1: "#f87171",
  2: "#fb923c",
  3: "#94a3b8",
  4: "#34d399",
  5: "#3a6fc9",
}

export function DiaryCalendar({
  selectedDate,
  monthStr,
  entryDates,
  moodByDate = {},
}: {
  selectedDate: string
  monthStr: string
  entryDates: string[]
  moodByDate?: Record<string, number>
}) {
  const router = useRouter()
  const monthDate = parseISO(monthStr + "-01")

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { locale: ja }),
    end: endOfWeek(endOfMonth(monthDate), { locale: ja }),
  })

  const navigate = (date: string, month?: string) => {
    const m = month ?? monthStr
    router.push(`/diary?date=${date}&month=${m}`)
  }

  const prevMonth = () => {
    const d = subMonths(monthDate, 1)
    const m = format(d, "yyyy-MM")
    navigate(selectedDate, m)
  }

  const nextMonth = () => {
    const d = addMonths(monthDate, 1)
    const m = format(d, "yyyy-MM")
    navigate(selectedDate, m)
  }

  const DOW = ["日", "月", "火", "水", "木", "金", "土"]

  const MOOD_EMOJI: Record<number, string> = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" }
  const moodValues = Object.values(moodByDate).filter(Boolean)
  const avgMood = moodValues.length > 0
    ? Math.round(moodValues.reduce((s, v) => s + v, 0) / moodValues.length)
    : null

  return (
    <div className="surface rounded-xl p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--faint)]" style={{ color: "var(--dim)" }}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-serif" style={{ color: "var(--text)" }}>
            {format(monthDate, "yyyy年M月", { locale: ja })}
          </h3>
          {entryDates.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(58,111,201,0.08)", color: "var(--accent)" }}>
              {entryDates.length}件
            </span>
          )}
          {avgMood !== null && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full"
              style={{ background: `${MOOD_COLORS[avgMood]}18`, color: MOOD_COLORS[avgMood] }}
              title={`今月の平均気分: ${avgMood}/5`}>
              {MOOD_EMOJI[avgMood]}
            </span>
          )}
          {monthStr !== format(new Date(), "yyyy-MM") && (
            <button
              onClick={() => navigate(format(new Date(), "yyyy-MM-dd"), format(new Date(), "yyyy-MM"))}
              className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all hover:opacity-80"
              style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.25)" }}
              title="今日へ戻る"
            >
              <CalendarDays size={9} />
              今日
            </button>
          )}
        </div>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-[var(--faint)]" style={{ color: "var(--dim)" }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 曜日 */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center text-[10px] py-1" style={{ color: "var(--faint)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const inMonth = isSameMonth(day, monthDate)
          const isSelected = dateStr === selectedDate
          const isToday = dateFnsIsToday(day)
          const hasEntry = entryDates.includes(dateStr)
          const mood = moodByDate[dateStr]

          return (
            <button
              key={dateStr}
              onClick={() => navigate(dateStr)}
              className={clsx(
                "relative h-9 w-full rounded-md text-xs transition-all duration-100",
                !inMonth && "opacity-20",
                isSelected && "font-medium",
              )}
              style={{
                color: isSelected ? "white" : isToday ? "var(--accent)" : "var(--text)",
                background: isSelected ? "var(--accent-2)" : "transparent",
                boxShadow: isToday && !isSelected ? "inset 0 0 0 1.5px rgba(58,111,201,0.5)" : undefined,
                fontWeight: isToday ? 600 : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--faint)"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
              }}
            >
              {format(day, "d")}
              {hasEntry && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: isSelected ? "rgba(255,255,255,0.55)" : (mood ? MOOD_COLORS[mood] : "var(--accent)") }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
