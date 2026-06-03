"use client"

import { useState, useTransition, useRef } from "react"
import { Plus } from "lucide-react"
import { createTask } from "@/actions/tasks"

export function QuickAddTask() {
  const [value, setValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    startTransition(async () => {
      await createTask({ title: value.trim(), priority: "MEDIUM" })
      setValue("")
      inputRef.current?.focus()
    })
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-center gap-2 px-3 rounded-xl transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", height: 44 }}
    >
      <Plus size={14} style={{ color: "var(--dim)", flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="タスクを追加..."
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: "var(--text)" }}
        disabled={isPending}
      />
      {value && (
        <button type="submit" disabled={isPending}
          className="text-xs px-2.5 py-1 rounded-lg shrink-0 transition-opacity"
          style={{ background: "var(--accent)", color: "white", opacity: isPending ? 0.5 : 1 }}>
          追加
        </button>
      )}
    </form>
  )
}
