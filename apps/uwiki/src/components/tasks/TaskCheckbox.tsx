"use client"

import { useTransition } from "react"
import { toggleTask } from "@/actions/tasks"

export function TaskCheckbox({ taskId, completed }: { taskId: string; completed: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => toggleTask(taskId, !completed))}
      disabled={pending}
      className="mt-0.5 w-4 h-4 rounded shrink-0 border transition-all duration-150 flex items-center justify-center"
      style={{
        borderColor: completed ? "var(--accent)" : "var(--border)",
        background: completed ? "var(--accent-2)" : "transparent",
        opacity: pending ? 0.5 : 1,
        pointerEvents: pending ? "none" : "auto",
      }}
    >
      {completed && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
