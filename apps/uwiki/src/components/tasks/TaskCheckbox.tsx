"use client"

import { useState, useTransition } from "react"
import { toggleTask } from "@/actions/tasks"

export function TaskCheckbox({ taskId, completed }: { taskId: string; completed: boolean }) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [popping, setPopping] = useState(false)

  // 楽観的UI: サーバー応答前に表示を先行更新
  const shown = optimistic !== null ? optimistic : completed

  const handleClick = () => {
    const next = !shown
    setOptimistic(next)
    if (next) {
      setPopping(true)
      setTimeout(() => setPopping(false), 350)
    }
    startTransition(async () => {
      await toggleTask(taskId, next)
      setOptimistic(null) // サーバー確定後にリセット
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={shown ? "タスクを未完了にする" : "タスクを完了にする"}
      aria-pressed={shown}
      className="shrink-0 flex items-center justify-center"
      style={{ width: 44, height: 44, background: "transparent", border: "none", padding: 0, cursor: "pointer", margin: "-8px -8px -8px 0" }}
    >
      <span
        className={`rounded flex items-center justify-center transition-all duration-150 ${popping ? "animate-check-pop" : ""}`}
        style={{
          width: 16, height: 16,
          borderWidth: 1.5, borderStyle: "solid",
          borderColor: shown ? "var(--accent)" : "var(--border)",
          background: shown ? "var(--accent-2)" : "transparent",
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
