"use client"

import Link from "next/link"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
} from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, BookOpen, Briefcase, CalendarDays } from "lucide-react"
import clsx from "clsx"

type Task = {
  id: string; title: string; priority: string; completed: boolean; dueDate?: string | Date | null
}

type GoogleEvent = {
  id: string; summary: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  htmlLink: string
}

type CaseItem = { id: string; name: string; dueDate: string | Date; status: string }

type Props = {
  monthStr: string
  prevMonth: string
  nextMonth: string
  tasksByDate: Record<string, Task[]>
  diaryByDate: Record<string, { id: string; title: string }>
  habitCountByDate: Record<string, number>
  totalHabits: number
  googleEvents?: GoogleEvent[]
  casesByDate?: Record<string, CaseItem[]>
}

const DOW = ["日", "月", "火", "水", "木", "金", "土"]
const priorityDot: Record<string, string> = {
  HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
}

export function CalendarView({
  monthStr, prevMonth, nextMonth,
  tasksByDate, diaryByDate, habitCountByDate, totalHabits,
  googleEvents = [], casesByDate = {},
}: Props) {
  const currentMonthStr = format(new Date(), "yyyy-MM")
  const isCurrentMonth = monthStr === currentMonthStr
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
        className="flex items-center justify-between px-4 py-4 sm:px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href={`/calendar?month=${prevMonth}`}
          className="p-2 rounded-lg hover:bg-[var(--faint)] text-dim transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>

        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg">
            {format(monthDate, "yyyy年 M月", { locale: ja })}
          </h2>
          {!isCurrentMonth && (
            <Link
              href={`/calendar?month=${currentMonthStr}`}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all hover:opacity-80"
              style={{
                background: "rgba(58,111,201,0.12)",
                color: "var(--accent)",
                border: "1px solid rgba(58,111,201,0.25)",
              }}
            >
              <CalendarDays size={9} />
              今月
            </Link>
          )}
        </div>

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
      <div className="grid grid-cols-7 auto-rows-[minmax(72px,auto)] sm:auto-rows-[minmax(100px,auto)]">
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd")
          const inMonth = isSameMonth(day, monthDate)
          const today = isToday(day)
          const tasks = tasksByDate[dateStr] ?? []
          const diary = diaryByDate[dateStr]
          const gEvents = gEventsByDate[dateStr] ?? []
          const casesOnDay = casesByDate[dateStr] ?? []
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
              style={{
                borderColor: "var(--border)",
                background: today ? "rgba(58,111,201,0.04)" : undefined,
              }}
            >
              {/* 日付 */}
              <div className="flex items-center justify-between mb-1">
                <Link
                  href={`/diary?date=${dateStr}`}
                  className={clsx(
                    "w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono transition-all",
                    today ? "font-bold text-white" : "hover:bg-[var(--faint)]"
                  )}
                  style={{
                    background: today ? "var(--accent-2)" : "transparent",
                    color: today ? "white" : idx % 7 === 0 ? "#f87171" : "var(--dim)",
                  }}
                  title={diary ? `日記: ${diary.title}` : `${format(day, "M/d")} の日記を書く`}
                >
                  {format(day, "d")}
                </Link>

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
              {tasks
                .slice()
                .sort((a, b) => {
                  const ta = a.dueDate ? new Date(a.dueDate).getTime() : 0
                  const tb = b.dueDate ? new Date(b.dueDate).getTime() : 0
                  return ta - tb
                })
                .slice(0, 3)
                .map((task) => {
                  const timeStr = task.dueDate
                    ? (() => {
                        const d = new Date(task.dueDate)
                        const h = d.getHours(); const m = d.getMinutes()
                        return (h !== 0 || m !== 0) ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")} ` : ""
                      })()
                    : ""
                  return (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
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
                      {timeStr && <span className="text-[9px] font-mono shrink-0" style={{ color: "var(--accent)" }}>{timeStr}</span>}
                      <span className="truncate">{task.title}</span>
                    </Link>
                  )
                })
              }
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

              {/* 案件期限 */}
              {casesOnDay.slice(0, 1).map((c) => (
                <Link key={c.id} href="/cases"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate block hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(201,168,76,0.12)", borderLeft: "2px solid #c9a84c", color: "var(--text)" }}
                >
                  <Briefcase size={8} style={{ color: "#c9a84c", flexShrink: 0 }} />
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
              {casesOnDay.length > 1 && (
                <p className="text-[9px] text-faint px-1">+{casesOnDay.length - 1}件</p>
              )}

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
