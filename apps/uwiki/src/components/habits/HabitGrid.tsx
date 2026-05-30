"use client"

import { useTransition } from "react"
import { deleteHabit, toggleHabitLog } from "@/actions/habits"
import { Trash2 } from "lucide-react"
import clsx from "clsx"

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
            <div key={d.date} className="w-9 text-center">
              <p className="text-[9px] text-faint">{d.dayLabel}</p>
              <p className={clsx("text-xs font-mono", d.date === todayStr ? "text-accent font-medium" : "text-dim")}>
                {d.label}
              </p>
            </div>
          ))}
        </div>
        <div className="w-16 text-right">
          <p className="text-[9px] font-mono text-faint">streak</p>
        </div>
        <div className="w-7" />
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

  return (
    <div className="group flex items-center px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      {/* 習慣名 */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: habit.color }} />
          <p className="text-sm truncate">{habit.name}</p>
        </div>
        {habit.description && (
          <p className="text-xs mt-0.5 ml-4 truncate text-dim">{habit.description}</p>
        )}
      </div>

      {/* 7日ドット */}
      <div className="flex gap-1 shrink-0">
        {last7.map((d) => {
          const done = habit.logDates.includes(d.date)
          return (
            <button
              key={d.date}
              disabled={pending}
              onClick={() => startTransition(() => toggleHabitLog(habit.id, d.date))}
              className="w-9 h-8 rounded-lg border transition-all duration-150"
              style={{
                background: done ? habit.color : "transparent",
                borderColor: done ? habit.color : "var(--border)",
                opacity: done ? 1 : 0.35,
              }}
              onMouseEnter={(e) => {
                if (!done) (e.currentTarget as HTMLElement).style.opacity = "0.6"
              }}
              onMouseLeave={(e) => {
                if (!done) (e.currentTarget as HTMLElement).style.opacity = "0.35"
              }}
            />
          )
        })}
      </div>

      {/* streak */}
      <div className="w-16 text-right px-2">
        {habit.streak > 0 ? (
          <span className="text-xs font-mono" style={{ color: habit.color }}>🌧 {habit.streak}</span>
        ) : (
          <span className="text-xs font-mono text-faint">—</span>
        )}
      </div>

      {/* 削除 */}
      <button
        onClick={() => startTransition(() => deleteHabit(habit.id))}
        className="w-7 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--faint)]"
        style={{ color: "var(--dim)" }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
