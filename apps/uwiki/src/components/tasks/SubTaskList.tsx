"use client"

import { useState, useTransition } from "react"
import { createSubTask, toggleSubTask, deleteSubTask } from "@/actions/tasks"
import { Plus } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

type SubTask = { id: string; title: string; completed: boolean }

function SubTaskItem({ sub, onToggle, onDelete }: {
  sub: SubTask
  onToggle: (id: string, next: boolean) => void
  onDelete: (id: string) => void
}) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const shown = optimistic !== null ? optimistic : sub.completed

  const handleToggle = () => {
    const next = !shown
    setOptimistic(next)
    onToggle(sub.id, next)
  }

  return (
    <li className="group flex items-center gap-2 py-1">
      <button
        onClick={handleToggle}
        aria-label={shown ? "サブタスクを未完了にする" : "サブタスクを完了にする"}
        aria-pressed={shown}
        className="w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all cursor-pointer"
        style={{
          borderColor: shown ? "var(--accent)" : "var(--border)",
          background: shown ? "var(--accent-2)" : "transparent",
        }}
      >
        {shown && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 2.5L3 4.5L7 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <span
        className="flex-1 text-xs leading-snug transition-all"
        style={{
          color: shown ? "var(--dim)" : "var(--text)",
          textDecoration: shown ? "line-through" : "none",
          opacity: shown ? 0.6 : 1,
        }}
      >
        {sub.title}
      </span>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ConfirmButton
          onConfirm={() => onDelete(sub.id)}
          size="xs"
          className="p-0.5 rounded hover:bg-[var(--faint)]"
        />
      </div>
    </li>
  )
}

export function SubTaskList({ taskId, subtasks }: { taskId: string; subtasks: SubTask[] }) {
  const [input, setInput] = useState("")
  const [pending, startTransition] = useTransition()
  // 楽観的に完了状態を管理
  const [optimisticStates, setOptimisticStates] = useState<Record<string, boolean>>({})

  const getShown = (sub: SubTask) =>
    optimisticStates[sub.id] !== undefined ? optimisticStates[sub.id] : sub.completed

  const add = () => {
    if (!input.trim()) return
    startTransition(async () => {
      await createSubTask(taskId, input.trim())
      setInput("")
    })
  }

  const handleToggle = (id: string, next: boolean) => {
    setOptimisticStates((prev) => ({ ...prev, [id]: next }))
    startTransition(async () => {
      await toggleSubTask(id, next)
      setOptimisticStates((prev) => { const n = { ...prev }; delete n[id]; return n })
    })
  }

  const handleDelete = (id: string) => {
    startTransition(() => deleteSubTask(id))
  }

  const doneCount = subtasks.filter((s) => getShown(s)).length
  const total = subtasks.length

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      {total > 0 && (
        <>
          <p className="text-[10px] font-mono text-dim mb-2">{doneCount}/{total} 完了</p>
          <div className="w-full h-0.5 rounded-full mb-2" style={{ background: "var(--faint)" }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${total > 0 ? (doneCount / total) * 100 : 0}%`,
                background: doneCount === total ? "var(--green)" : "var(--accent)",
              }}
            />
          </div>
        </>
      )}

      <ul className="space-y-1">
        {subtasks.map((sub) => (
          <SubTaskItem
            key={sub.id}
            sub={sub}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </ul>

      {/* サブタスク追加 */}
      <div className="flex items-center gap-2 mt-2 px-2 py-1.5 rounded-lg transition-colors"
        style={{ border: "1px dashed var(--border)" }}
        onFocus={() => {}} >
        <Plus size={11} className="text-faint shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-xs placeholder:text-faint"
          placeholder="サブタスクを追加..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add() }}
          onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = "var(--border)")}
          disabled={pending}
        />
        {input && (
          <button onClick={add} disabled={pending} className="text-[10px] text-accent shrink-0">追加</button>
        )}
      </div>
    </div>
  )
}
