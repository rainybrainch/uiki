"use client"

import { useState, useTransition } from "react"
import { createSubTask, toggleSubTask, deleteSubTask } from "@/actions/tasks"
import { Plus, Trash2 } from "lucide-react"

type SubTask = { id: string; title: string; completed: boolean }

export function SubTaskList({ taskId, subtasks }: { taskId: string; subtasks: SubTask[] }) {
  const [input, setInput] = useState("")
  const [pending, startTransition] = useTransition()

  const add = () => {
    if (!input.trim()) return
    startTransition(async () => {
      await createSubTask(taskId, input.trim())
      setInput("")
    })
  }

  const done = subtasks.filter((s) => s.completed).length

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      {subtasks.length > 0 && (
        <p className="text-[10px] font-mono text-dim mb-2">
          {done}/{subtasks.length} 完了
        </p>
      )}

      {/* 進捗バー */}
      {subtasks.length > 0 && (
        <div className="w-full h-0.5 rounded-full mb-2" style={{ background: "var(--faint)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(done / subtasks.length) * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
      )}

      <ul className="space-y-1">
        {subtasks.map((sub) => (
          <li key={sub.id} className="group flex items-center gap-2 py-1">
            <button
              onClick={() => startTransition(() => toggleSubTask(sub.id, !sub.completed))}
              className="w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all"
              style={{
                borderColor: sub.completed ? "var(--accent)" : "var(--border)",
                background: sub.completed ? "var(--accent-2)" : "transparent",
              }}
            >
              {sub.completed && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 2.5L3 4.5L7 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <span
              className="flex-1 text-xs leading-snug"
              style={{
                color: sub.completed ? "var(--dim)" : "var(--text)",
                textDecoration: sub.completed ? "line-through" : "none",
              }}
            >
              {sub.title}
            </span>
            <button
              onClick={() => startTransition(() => deleteSubTask(sub.id))}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--faint)] text-dim"
            >
              <Trash2 size={10} />
            </button>
          </li>
        ))}
      </ul>

      {/* サブタスク追加 */}
      <div className="flex items-center gap-2 mt-2">
        <Plus size={12} className="text-faint shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-xs placeholder:text-faint"
          placeholder="サブタスクを追加..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add() }}
        />
      </div>
    </div>
  )
}
