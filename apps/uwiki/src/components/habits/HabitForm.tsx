"use client"

import { useState, useTransition } from "react"
import { createHabit } from "@/actions/habits"
import { Plus } from "lucide-react"

const COLORS = [
  "#3a6fc9", "#5d8ad1", "#2456b8",
  "#6366f1", "#8b5cf6", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444",
]

export function HabitForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await createHabit({ name: name.trim(), description: description || undefined, color })
      setName("")
      setDescription("")
      setColor(COLORS[0])
      setOpen(false)
    })
  }

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Plus size={16} strokeWidth={1.5} style={{ color: "var(--dim)" }} />
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--dim)]"
          placeholder="新しい習慣を追加..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
        />
      </div>

      {open && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <input
            className="input-field text-xs"
            placeholder="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--dim)" }}>カラー</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: color === c ? "white" : "transparent",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>キャンセル</button>
            <button
              className="btn-primary text-xs"
              onClick={submit}
              disabled={pending || !name.trim()}
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
