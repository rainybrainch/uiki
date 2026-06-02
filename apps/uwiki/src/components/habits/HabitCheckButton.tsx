"use client"

import { useTransition } from "react"
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

  return (
    <button
      onClick={() => startTransition(() => toggleHabitLog(habitId))}
      disabled={pending}
      className="w-5 h-5 rounded-full shrink-0 border-2 transition-all duration-200 flex items-center justify-center"
      style={{
        borderColor: doneToday ? color : "var(--border)",
        background: doneToday ? color : "transparent",
        opacity: pending ? 0.5 : 1,
        pointerEvents: pending ? "none" : "auto",
      }}
    >
      {doneToday && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
