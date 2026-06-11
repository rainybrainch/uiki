"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, parseISO,
} from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, BookOpen, Briefcase, CalendarDays, Plus, X, Loader2, CheckSquare } from "lucide-react"
import clsx from "clsx"
import { createTask } from "@/actions/tasks"

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

function DayPanel({
  dateStr, tasks, gEvents, diary, cases, onClose,
}: {
  dateStr: string
  tasks: Task[]
  gEvents: GoogleEvent[]
  diary?: { id: string; title: string }
  cases: CaseItem[]
  onClose: () => void
}) {
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskTitle, setTaskTitle] = useState("")
  const [addToGcal, setAddToGcal] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        await createTask({
          title: taskTitle.trim(),
          dueDate: dateStr,
          priority: "MEDIUM",
        })

        if (addToGcal) {
          await fetch("/api/calendar/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: taskTitle.trim(), date: dateStr, allDay: true }),
          })
        }

        setTaskTitle("")
        setDone(true)
        setTimeout(() => { setDone(false); setShowAddTask(false) }, 1500)
      } catch {
        setError("追加に失敗しました")
      }
    })
  }

  const label = format(parseISO(dateStr), "M月d日（E）", { locale: ja })
  const completedTasks = tasks.filter((t) => t.completed).length

  return (
    <div className="animate-fade-in-fast rounded-xl p-4 mt-3"
      style={{ background: "rgba(58,111,201,0.05)", border: "1px solid rgba(58,111,201,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--accent)" }}>{label}</span>
          {tasks.length > 0 && (() => {
            const pct = Math.round((completedTasks / tasks.length) * 100)
            const allDone = completedTasks === tasks.length
            return (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: allDone ? "var(--green)" : "var(--dim)",
                    background: allDone ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)",
                  }}>
                  {completedTasks}/{tasks.length}完了
                </span>
                <div className="w-16 rounded-full overflow-hidden" style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: allDone ? "var(--green)" : "var(--accent)" }} />
                </div>
              </div>
            )
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddTask((v) => !v)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.25)" }}
          >
            <Plus size={11} /> タスク追加
          </button>
          <button onClick={onClose} className="p-1 text-faint hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* タスク追加フォーム */}
      {showAddTask && (
        <form onSubmit={handleAddTask} className="mb-3 p-3 rounded-lg animate-fade-in-fast"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
          <input
            className="input-base text-sm w-full mb-2"
            placeholder="タスク名"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-dim cursor-pointer">
              <input type="checkbox" checked={addToGcal} onChange={(e) => setAddToGcal(e.target.checked)}
                className="w-3.5 h-3.5" />
              Google Calendarにも追加
            </label>
            <button type="submit" disabled={isPending || !taskTitle.trim()}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: "var(--accent)", color: "white" }}>
              {isPending ? <Loader2 size={11} className="animate-spin" /> : done ? "✓" : <Plus size={11} />}
              {done ? "追加しました" : "追加"}
            </button>
          </div>
          {error && <p className="text-xs mt-1" style={{ color: "var(--red)" }}>{error}</p>}
        </form>
      )}

      {/* Google Calendarイベント */}
      {gEvents.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-dim mb-1.5">Google Calendar</p>
          <div className="space-y-1">
            {gEvents.map((ev) => {
              const timeStr = ev.start.dateTime
                ? format(new Date(ev.start.dateTime), "HH:mm")
                : "終日"
              return (
                <a key={ev.id} href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
                  <span className="font-mono text-[10px] shrink-0" style={{ color: "#4ade80" }}>{timeStr}</span>
                  <span className="truncate">{ev.summary}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* タスク */}
      {tasks.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-dim mb-1.5">タスク</p>
          <div className="space-y-1">
            {tasks.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`}
                className={clsx("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity", t.completed && "opacity-40")}
                style={{ background: "rgba(58,111,201,0.08)", border: "1px solid rgba(58,111,201,0.15)" }}>
                <CheckSquare size={11} style={{ color: priorityDot[t.priority], flexShrink: 0 }} />
                <span className={clsx("truncate", t.completed && "line-through")}>{t.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 案件 */}
      {cases.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-dim mb-1.5">案件期限</p>
          <div className="space-y-1">
            {cases.map((c) => (
              <Link key={c.id} href="/cases"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
                style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <Briefcase size={11} style={{ color: "#c9a84c", flexShrink: 0 }} />
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 日記 */}
      {diary && (
        <div>
          <p className="text-[10px] text-dim mb-1.5">日記</p>
          <Link href={`/diary?date=${dateStr}`}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:opacity-80 transition-opacity"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
            <BookOpen size={11} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <span className="truncate">{diary.title}</span>
          </Link>
        </div>
      )}

      {gEvents.length === 0 && tasks.length === 0 && cases.length === 0 && !diary && (
        <p className="text-xs text-faint text-center py-2">この日の予定はありません</p>
      )}
    </div>
  )
}

export function CalendarView({
  monthStr, prevMonth, nextMonth,
  tasksByDate, diaryByDate, habitCountByDate, totalHabits,
  googleEvents = [], casesByDate = {},
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const currentMonthStr = format(new Date(), "yyyy-MM")
  const isCurrentMonth = monthStr === currentMonthStr

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

  const handleDayClick = (dateStr: string) => {
    setSelectedDate((prev) => prev === dateStr ? null : dateStr)
  }

  return (
    <div>
      <div className="surface rounded-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-6"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href={`/calendar?month=${prevMonth}`}
            className="p-2 rounded-lg hover:bg-[var(--faint)] text-dim transition-colors">
            <ChevronLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-lg">{format(monthDate, "yyyy年 M月", { locale: ja })}</h2>
            {!isCurrentMonth && (
              <Link href={`/calendar?month=${currentMonthStr}`}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all hover:opacity-80"
                style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.25)" }}>
                <CalendarDays size={9} /> 今月
              </Link>
            )}
          </div>
          <Link href={`/calendar?month=${nextMonth}`}
            className="p-2 rounded-lg hover:bg-[var(--faint)] text-dim transition-colors">
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border)" }}>
          {DOW.map((d, i) => (
            <div key={d} className="py-3 text-center text-xs font-medium"
              style={{ color: i === 0 ? "#f87171" : i === 6 ? "var(--accent)" : "var(--dim)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7 auto-rows-[minmax(64px,auto)] sm:auto-rows-[minmax(100px,auto)]">
          {days.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const inMonth = isSameMonth(day, monthDate)
            const today = isToday(day)
            const selected = selectedDate === dateStr
            const tasks = tasksByDate[dateStr] ?? []
            const diary = diaryByDate[dateStr]
            const gEvents = gEventsByDate[dateStr] ?? []
            const casesOnDay = casesByDate[dateStr] ?? []
            const habitCount = habitCountByDate[dateStr] ?? 0
            const habitRate = totalHabits > 0 ? habitCount / totalHabits : 0

            return (
              <div key={dateStr}
                className={clsx("p-2 transition-colors cursor-pointer", !inMonth && "opacity-30", idx % 7 !== 6 && "border-r", Math.floor(idx / 7) < Math.floor((days.length - 1) / 7) && "border-b")}
                style={{
                  borderColor: "var(--border)",
                  background: selected ? "rgba(58,111,201,0.1)" : today ? "rgba(58,111,201,0.04)" : undefined,
                  outline: selected ? "2px solid rgba(58,111,201,0.4)" : undefined,
                  outlineOffset: "-2px",
                }}
                onClick={() => handleDayClick(dateStr)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={clsx("w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono", today ? "font-bold text-white" : "")}
                    style={{
                      background: today ? "var(--accent-2)" : "transparent",
                      color: today ? "white" : idx % 7 === 0 ? "#f87171" : "var(--dim)",
                    }}>
                    {format(day, "d")}
                  </div>
                  {totalHabits > 0 && habitRate > 0 && (
                    <div className="w-4 h-4 rounded-full border" style={{
                      background: `conic-gradient(var(--accent) ${habitRate * 360}deg, transparent 0deg)`,
                      borderColor: "var(--border)",
                    }} />
                  )}
                </div>

                {/* ── スマホ: ドット + 件数バッジ ── */}
                <div className="sm:hidden mt-1 flex flex-col gap-0.5">
                  {gEvents.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4ade80" }} />
                      <span className="text-[9px] font-mono leading-none" style={{ color: "#4ade80" }}>{gEvents.length}</span>
                    </div>
                  )}
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                      <span className="text-[9px] font-mono leading-none" style={{ color: "var(--accent)" }}>{tasks.length}</span>
                    </div>
                  )}
                  {casesOnDay.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#c9a84c" }} />
                      <span className="text-[9px] font-mono leading-none" style={{ color: "#c9a84c" }}>{casesOnDay.length}</span>
                    </div>
                  )}
                  {diary && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--amber)" }} />
                  )}
                </div>

                {/* ── PC: テキストチップ ── */}
                <div className="hidden sm:block">
                  {tasks.slice(0, 2).map((task) => (
                    <div key={task.id}
                      className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate", task.completed && "opacity-40")}
                      style={{ background: "rgba(58,111,201,0.1)", color: "var(--text)", borderLeft: `2px solid ${priorityDot[task.priority]}` }}>
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {tasks.length > 2 && <p className="text-[9px] text-faint px-1">+{tasks.length - 2}</p>}

                  {gEvents.slice(0, 2).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate"
                      style={{ background: "rgba(66,200,120,0.12)", borderLeft: "2px solid #4ade80", color: "var(--text)" }}>
                      <span className="truncate">{ev.summary}</span>
                    </div>
                  ))}
                  {gEvents.length > 2 && <p className="text-[9px] text-faint px-1">+{gEvents.length - 2}</p>}

                  {casesOnDay.slice(0, 1).map((c) => (
                    <div key={c.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] mb-0.5 truncate"
                      style={{ background: "rgba(201,168,76,0.12)", borderLeft: "2px solid #c9a84c", color: "var(--text)" }}>
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}

                  {diary && (
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] truncate" style={{ color: "var(--amber)" }}>
                      <BookOpen size={9} />
                      <span className="truncate">{diary.title}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 選択した日の詳細パネル */}
      {selectedDate && (
        <DayPanel
          dateStr={selectedDate}
          tasks={tasksByDate[selectedDate] ?? []}
          gEvents={gEventsByDate[selectedDate] ?? []}
          diary={diaryByDate[selectedDate]}
          cases={casesByDate[selectedDate] ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
