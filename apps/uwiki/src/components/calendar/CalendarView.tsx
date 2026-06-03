"use client"

import Link from "next/link"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, parseISO,
} from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CheckSquare, BookOpen } from "lucide-react"
import clsx from "clsx"

type Task = {
  id: string; title: string; priority: string; completed: boolean
}

type GoogleEvent = {
  id: string; summary: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  htmlLink: string
}

type Props = {
  monthStr: string
  prevMonth: string
  nextMonth: string
  tasksByDate: Record<string, Task[]>
  diaryByDate: Record<string, { id: string; title: string }>
  habitCountByDate: Record<string, number>
  totalHabits: number
  googleEvents?: GoogleEvent[]
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"]
const priorityDot: Record<string, string> = {
  HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
}

export function CalendarView({
  monthStr, prevMonth, nextMonth,
  tasksByDate, diaryByDate, habitCountByDate, totalHabits,
  googleEvents = [],
}: Props) {
  // Google Calendar イベントを日付別に整理
  const gEventsByDate: Record<string, GoogleEvent[]> = {}
  for (const ev of googleEvents) {
    const dateStr = (ev.start.dateTime
      ? format(new Date(ev.start.dateTime), "yyyy-MM-dd")
      : ev.start.date) ?? ""
    if (!gEventsByDate[dateStr]) gEventsByDate[dateStr] = []
    gEventsByDate[dateStr].push(ev)
  }
  const monthDate = new Date(monthStr + "-01")

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(monthDate), { locale: ja }),
    end: endOfWeek(endOfMonth(monthDate), { locale: ja }),
  })

  return (
    <div className="surface rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href={`/calendar?month=${prevMonth}`}
          className="p-2 rounded-lg hover:bg-[var(--faint)] text-dim transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>
        <h2 className="font-serif text-lg">
          {format(monthDate, "yyyy年 M月", { locale: ja })}
        </h2>
        <Link
          href={`/calendar?month=${nextMonth}`}
          className="p-2 rounded-lg hover:bg-[var(--faint)] text-dim transition-colors"
        >
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border)" }}>
        {DOW.map((d, i) => (
          <div
            key={d}
            className="py-3 text-center text-xs font-medium"
            style={{ color: i === 0 ? "#f87171" : i === 6 ? "var(--accent)" : "var(--dim)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)]">
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const inMonth = isSameMonth(day, monthDate)
          const today = isToday(day)
          const tasks = tasksByDate[dateStr] ?? []
          const diary = diaryByDate[dateStr]
          const gEvents = gEventsByDate[dateStr] ?? []
          const habitCount = habitCountByDate[dateStr] ?? 0
          const habitRate = totalHabits > 0 ? habitCount / totalHabits : 0

          return (
            <div
              key={dateStr}
              className={clsx(
                "p-2 transition-colors",
                !inMonth && "opacity-30",
                idx % 7 !== 6 && "border-r",
                Math.floor(idx / 7) < Math.floor((days.length - 1) / 7) && "border-b",
              )}
              style={{ borderColor: "var(--border)" }}
            >
              {/* 日付 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={clsx(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono",
                    today && "font-bold text-white"
                  )}
                  style={{
                    background: today ? "var(--accent-2)" : "transparent",
                    color: today ? "white" : idx % 7 === 0 ? "#f87171" : "var(--dim)",
                  }}
                >
                  {format(day, "d")}
                </span>

                {/* 習慣達成インジケーター */}
                {totalHabits > 0 && habitRate > 0 && (
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{
                      background: `conic-gradient(var(--accent) ${habitRate * 360}deg, transparent 0deg)`,
                      borderColor: "var(--border)",
                    }}
                    title={`習慣 ${habitCount}/${totalHabits}`}
                  />
                )}
              </div>

              {/* タスク */}
              {tasks.slice(0, 3).map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className={clsx(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate block",
                    "hover:opacity-80 transition-opacity",
                    task.completed && "opacity-40"
                  )}
                  style={{
                    background: "rgba(58,111,201,0.1)",
                    color: "var(--text)",
                    borderLeft: `2px solid ${priorityDot[task.priority]}`,
                  }}
                >
                  {task.title}
                </Link>
              ))}
              {tasks.length > 3 && (
                <p className="text-[9px] text-faint px-1">+{tasks.length - 3}件</p>
              )}

              {/* Google Calendar イベント */}
              {gEvents.slice(0, 2).map((ev) => (
                <a
                  key={ev.id}
                  href={ev.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate block hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(66,200,120,0.12)", borderLeft: "2px solid #4ade80", color: "var(--text)" }}
                >
                  {ev.summary}
                </a>
              ))}

              {/* 日記インジケーター */}
              {diary && (
                <Link
                  href={`/diary?date=${dateStr}`}
                  className="flex items-center gap-1 mt-0.5 text-[10px] truncate"
                  style={{ color: "var(--amber)" }}
                >
                  <BookOpen size={9} />
                  <span className="truncate">{diary.title}</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
