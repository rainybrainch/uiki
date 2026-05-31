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
import { ChevronLeft, ChevronRight } from "lucide-react"
import clsx from "clsx"

export function DiaryCalendar({
  selectedDate,
  monthStr,
  entryDates,
}: {
  selectedDate: string
  monthStr: string
  entryDates: string[]
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

  return (
    <div className="surface rounded-xl p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--faint)]" style={{ color: "var(--dim)" }}>
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-sm font-serif" style={{ color: "var(--text)" }}>
          {format(monthDate, "yyyy年M月", { locale: ja })}
        </h3>
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
          const hasEntry = entryDates.includes(dateStr)

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
                color: isSelected ? "white" : "var(--text)",
                background: isSelected ? "var(--accent-2)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "var(--faint)"
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"
              }}
            >
              {format(day, "d")}
              {hasEntry && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
