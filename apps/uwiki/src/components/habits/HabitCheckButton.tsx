"use client"

import { useState, useTransition } from "react"
import { toggleHabitLog } from "@/actions/habits"

export function HabitCheckButton({
  habitId,
  doneToday,
  color,
}: {
  habitId: string
  doneToday: boolean
  color: string
}) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [popping, setPopping] = useState(false)

  const shown = optimistic !== null ? optimistic : doneToday

  const handleClick = () => {
    const next = !shown
    setOptimistic(next)
    if (next) {
      setPopping(true)
      setTimeout(() => setPopping(false), 350)
    }
    startTransition(async () => {
      await toggleHabitLog(habitId)
      setOptimistic(null)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={shown ? "今日の習慣を取り消す" : "今日の習慣を記録する"}
      aria-pressed={shown}
      className="shrink-0 flex items-center justify-center transition-opacity"
      style={{
        width: 44, height: 44, borderRadius: "50%",
        background: "transparent", border: "none", padding: 0,
        opacity: pending ? 0.5 : 1,
        cursor: "pointer",
        margin: "-4px",
      }}
    >
      <span
        className={`flex items-center justify-center rounded-full border-2 transition-all duration-150 ${popping ? "animate-check-pop" : ""}`}
        style={{
          width: 20, height: 20,
          borderColor: shown ? color : "var(--border)",
          background: shown ? color : "transparent",
          opacity: pending ? 0.7 : 1,
          transform: popping ? "scale(1.15)" : "scale(1)",
        }}
      >
        {shown && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}
