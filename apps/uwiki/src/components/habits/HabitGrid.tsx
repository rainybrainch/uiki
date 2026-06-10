"use client"

import { useTransition, useState, useRef } from "react"
import { deleteHabit, toggleHabitLog, updateHabit } from "@/actions/habits"
import { Trash2, Pencil, Check, X } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import clsx from "clsx"

const EDIT_COLORS = [
  "#3a6fc9", "#5d8ad1", "#6366f1", "#8b5cf6",
  "#ec4899", "#10b981", "#4ade80", "#f59e0b", "#ef4444",
]

type HabitWithStats = {
  id: string
  name: string
  description: string | null
  color: string
  streak: number
  doneToday: boolean
  logDates: string[]
}

type DayLabel = { date: string; label: string; dayLabel: string }

export function HabitGrid({ habits, last7, todayStr }: {
  habits: HabitWithStats[]
  last7: DayLabel[]
  todayStr: string
}) {
  return (
    <div className="surface rounded-xl overflow-hidden">
      {/* 日付ヘッダー */}
      <div
        className="flex items-center px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex-1" />
        <div className="flex gap-1 shrink-0">
          {last7.map((d) => (
            <div key={d.date} className="w-8 sm:w-9 text-center">
              <p className="text-[8px] sm:text-[9px] text-faint">{d.dayLabel}</p>
              <p className={clsx("text-[10px] sm:text-xs font-mono", d.date === todayStr ? "text-accent font-medium" : "text-dim")}>
                {d.label}
              </p>
            </div>
          ))}
        </div>
        <div className="w-12 sm:w-16 text-right">
          <p className="text-[9px] font-mono text-faint">streak</p>
        </div>
        <div className="w-6 sm:w-7" />
      </div>

      {/* 習慣行 */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {habits.map((habit) => (
          <HabitRow key={habit.id} habit={habit} last7={last7} />
        ))}
      </div>
    </div>
  )
}

function HabitRow({ habit, last7 }: { habit: HabitWithStats; last7: DayLabel[] }) {
  const [pending, startTransition] = useTransition()
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [editColor, setEditColor] = useState(habit.color)
  const inputRef = useRef<HTMLInputElement>(null)
  const todayDate = last7[last7.length - 1]?.date

  const saveEdit = () => {
    if (!editName.trim()) { setEditing(false); return }
    startTransition(async () => {
      await updateHabit(habit.id, { name: editName.trim(), color: editColor })
      setEditing(false)
    })
  }

  const cancelEdit = () => {
    setEditName(habit.name)
    setEditColor(habit.color)
    setEditing(false)
  }

  return (
    <div className="group flex items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      {/* 習慣名 / 編集フォーム */}
      <div className="flex-1 min-w-0 pr-3 sm:pr-4">
        {editing ? (
          <div className="space-y-2">
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
              className="input-field text-sm w-full"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {EDIT_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setEditColor(c)}
                    className="w-5 h-5 rounded-full border-2 transition-transform"
                    style={{
                      background: c,
                      borderColor: editColor === c ? "white" : "transparent",
                      transform: editColor === c ? "scale(1.2)" : "scale(1)",
                    }} />
                ))}
              </div>
              <div className="flex gap-1 ml-auto shrink-0">
                <button onClick={saveEdit} disabled={pending}
                  className="p-1 rounded transition-colors hover:bg-[var(--faint)]"
                  style={{ color: "var(--green)" }}>
                  <Check size={13} />
                </button>
                <button onClick={cancelEdit}
                  className="p-1 rounded transition-colors hover:bg-[var(--faint)] text-dim">
                  <X size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: habit.color }} />
            <p className="text-sm truncate" title={habit.name}>{habit.name}</p>
            <button
              onClick={() => setEditing(true)}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--faint)] text-faint hover:text-white shrink-0"
            >
              <Pencil size={10} />
            </button>
          </div>
        )}
        {!editing && habit.description && (
          <p className="text-xs mt-0.5 ml-4 truncate text-dim">{habit.description}</p>
        )}
      </div>

      {/* 7日ドット */}
      <div className="flex gap-1 shrink-0">
        {last7.map((d) => {
          const done = habit.logDates.includes(d.date)
          const isToday = d.date === todayDate
          return (
            <button
              key={d.date}
              disabled={pending}
              onClick={() => startTransition(() => toggleHabitLog(habit.id, d.date))}
              onMouseEnter={() => setHoverDate(d.date)}
              onMouseLeave={() => setHoverDate(null)}
              aria-label={`${d.date} ${done ? "達成済み（取り消す）" : "未達成（記録する）"}`}
              aria-pressed={done}
              className="w-8 sm:w-9 h-8 sm:h-8 rounded-lg border transition-all duration-150"
              style={{
                background: done ? habit.color : hoverDate === d.date ? `${habit.color}30` : "transparent",
                borderColor: done ? habit.color : isToday ? `${habit.color}60` : hoverDate === d.date ? `${habit.color}80` : "var(--border)",
                opacity: done ? 1 : isToday ? 0.85 : 0.45,
                boxShadow: isToday && !done ? `0 0 0 1px ${habit.color}30` : undefined,
              }}
            />
          )
        })}
      </div>

      {/* streak + 週達成率 */}
      <div className="w-12 sm:w-16 text-right px-1 sm:px-2 flex flex-col items-end gap-0.5">
        {habit.streak > 0 ? (
          <span className="text-[10px] sm:text-xs font-mono" style={{ color: habit.color }}>🌧 {habit.streak}</span>
        ) : habit.doneToday ? (
          <span className="text-[10px] font-mono" style={{ color: habit.color }}>1日目</span>
        ) : (
          <span className="text-[10px] font-mono text-faint">未</span>
        )}
        {(() => {
          const weekDone = last7.filter((d) => habit.logDates.includes(d.date)).length
          const rate = Math.round((weekDone / last7.length) * 100)
          return (
            <span className="text-[9px] font-mono hidden sm:inline"
              style={{ color: rate >= 70 ? habit.color : "var(--faint)", opacity: rate >= 70 ? 0.85 : 0.5 }}>
              {rate}%
            </span>
          )
        })()}
      </div>

      {/* 削除 */}
      <div className="w-auto sm:w-7 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ConfirmButton
          onConfirm={() => startTransition(() => deleteHabit(habit.id))}
          size="xs"
          className="p-1 rounded hover:bg-[var(--faint)]"
        />
      </div>
    </div>
  )
}
