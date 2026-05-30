"use client"

import { useState, useTransition } from "react"
import { createTask } from "@/actions/tasks"
import { Plus, SlidersHorizontal } from "lucide-react"

type Priority = "HIGH" | "MEDIUM" | "LOW"
type Recurrence = "daily" | "weekly" | "monthly"
type Project = { id: string; name: string; color: string }

export function TaskForm({
  compact,
  projects = [],
  defaultProjectId,
}: {
  compact?: boolean
  projects?: Project[]
  defaultProjectId?: string
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [memo, setMemo] = useState("")
  const [priority, setPriority] = useState<Priority>("MEDIUM")
  const [dueDate, setDueDate] = useState("")
  const [tags, setTags] = useState("")
  const [recurrence, setRecurrence] = useState<Recurrence | "">("")
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createTask({
        title: title.trim(),
        memo: memo || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags: tags || undefined,
        recurrence: (recurrence as Recurrence) || undefined,
        projectId: projectId || undefined,
      })
      setTitle(""); setMemo(""); setPriority("MEDIUM")
      setDueDate(""); setTags(""); setRecurrence("")
      setOpen(false)
    })
  }

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Plus size={15} strokeWidth={1.5} className="text-dim shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-dim"
          placeholder="タスクを追加..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() }
          }}
        />
        {!compact && (
          <button
            onClick={() => setOpen(!open)}
            className={`p-1.5 rounded-lg transition-all ${open ? "bg-[rgba(58,111,201,0.15)] text-accent" : "text-dim hover:bg-[var(--faint)] hover:text-white"}`}
          >
            <SlidersHorizontal size={14} />
          </button>
        )}
      </div>

      {open && !compact && (
        <div className="border-t px-4 py-4 space-y-3 animate-fade-in-fast" style={{ borderColor: "var(--border)" }}>
          <textarea className="input-field resize-none text-xs" rows={2} placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block text-dim">優先度</label>
              <select className="input-field text-xs" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="HIGH">🔴 高</option>
                <option value="MEDIUM">🔵 中</option>
                <option value="LOW">⚪ 低</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block text-dim">締切日</label>
              <input type="date" className="input-field text-xs" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block text-dim">繰り返し</label>
              <select className="input-field text-xs" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence | "")}>
                <option value="">なし</option>
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1.5 block text-dim">タグ</label>
              <input className="input-field text-xs" placeholder="仕事, 個人" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-xs mb-1.5 block text-dim">プロジェクト</label>
              <select className="input-field text-xs" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">なし</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>キャンセル</button>
            <button className="btn-primary text-xs" onClick={submit} disabled={pending || !title.trim()}>追加</button>
          </div>
        </div>
      )}
    </div>
  )
}
