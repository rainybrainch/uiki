"use client"

import { useState, useTransition, useRef } from "react"
import { createTask } from "@/actions/tasks"
import { Plus, SlidersHorizontal } from "lucide-react"
import { format, addDays } from "date-fns"

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
  const [dueTime, setDueTime] = useState("")
  const [tags, setTags] = useState("")
  const [recurrence, setRecurrence] = useState<Recurrence | "">("")
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "")
  const [justAdded, setJustAdded] = useState(false)
  const [pending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      const fullDueDate = dueDate
        ? dueTime ? `${dueDate}T${dueTime}:00` : dueDate
        : undefined
      await createTask({
        title: title.trim(),
        memo: memo || undefined,
        priority,
        dueDate: fullDueDate,
        tags: tags || undefined,
        recurrence: (recurrence as Recurrence) || undefined,
        projectId: projectId || undefined,
      })
      setTitle(""); setMemo(""); setPriority("MEDIUM")
      setDueDate(""); setDueTime(""); setTags(""); setRecurrence("")
      setOpen(false)
      setJustAdded(true)
      setTimeout(() => { setJustAdded(false); titleRef.current?.focus() }, 1200)
    })
  }

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd")
  const nextWeekStr = format(addDays(new Date(), 7), "yyyy-MM-dd")

  const QUICK_DATES = [
    { label: "今日", value: todayStr },
    { label: "明日", value: tomorrowStr },
    { label: "来週", value: nextWeekStr },
  ] as const

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: open ? "1px solid var(--border)" : undefined }}>
        {justAdded
          ? <span className="text-sm shrink-0 animate-check-pop" style={{ color: "var(--green)" }}>✓</span>
          : <Plus size={15} strokeWidth={1.5} className="text-dim shrink-0" />
        }
        <input
          ref={titleRef}
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder={justAdded ? "追加しました！" : "タスクを追加..."}
          style={{ color: justAdded ? "var(--green)" : "var(--text)" }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() }
          }}
        />
        {/* クイック日付チップ（コンパクトでない時のみ） */}
        {!compact && !open && (
          <div className="flex gap-1 shrink-0">
            {QUICK_DATES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDueDate(dueDate === value ? "" : value)}
                className="px-2 py-1 rounded-md text-[10px] transition-all hidden sm:block"
                style={{
                  background: dueDate === value ? "rgba(58,111,201,0.18)" : "transparent",
                  border: `1px solid ${dueDate === value ? "rgba(58,111,201,0.4)" : "var(--border)"}`,
                  color: dueDate === value ? "var(--accent)" : "var(--dim)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {!compact && (
          <button
            onClick={() => setOpen(!open)}
            className={`p-1.5 rounded-lg transition-all ${open ? "bg-[rgba(58,111,201,0.15)] text-accent" : "text-dim hover:bg-[var(--faint)] hover:text-white"}`}
          >
            <SlidersHorizontal size={14} />
          </button>
        )}
      </div>

      {/* スマホ用クイック日付チップ（入力フォーカス時に表示） */}
      {!compact && !open && title && (
        <div className="flex gap-1.5 px-4 py-2 sm:hidden" style={{ borderTop: "1px solid var(--border)" }}>
          {QUICK_DATES.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDueDate(dueDate === value ? "" : value)}
              className="px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                background: dueDate === value ? "rgba(58,111,201,0.18)" : "var(--faint)",
                border: `1px solid ${dueDate === value ? "rgba(58,111,201,0.4)" : "transparent"}`,
                color: dueDate === value ? "var(--accent)" : "var(--dim)",
              }}
            >
              {label}
            </button>
          ))}
          {dueDate && (
            <span className="px-2 py-1.5 rounded-full text-xs font-mono" style={{ color: "var(--accent)" }}>
              {dueDate === todayStr ? "今日" : dueDate === tomorrowStr ? "明日" : dueDate}
            </span>
          )}
        </div>
      )}

      {open && !compact && (
        <div className="border-t px-4 py-4 space-y-3 animate-fade-in-fast" style={{ borderColor: "var(--border)" }}>
          <textarea className="input-field resize-none text-xs" rows={2} placeholder="メモ" value={memo} onChange={(e) => setMemo(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block text-dim">優先度</label>
              <div className="flex gap-1">
                {([
                  { v: "HIGH",   label: "高", color: "var(--red)" },
                  { v: "MEDIUM", label: "中", color: "var(--accent)" },
                  { v: "LOW",    label: "低", color: "var(--dim)" },
                ] as const).map(({ v, label, color }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPriority(v)}
                    className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                    style={{
                      background: priority === v ? `${color}18` : "transparent",
                      borderColor: priority === v ? color : "var(--border)",
                      color: priority === v ? color : "var(--dim)",
                      fontWeight: priority === v ? 600 : 400,
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs mb-1.5 block text-dim">締切日時</label>
              <div className="flex gap-1">
                <input type="date" className="input-field text-xs flex-1" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <input type="time" className="input-field text-xs w-24" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block text-dim">繰り返し</label>
              <div className="flex gap-1">
                {([
                  { v: "",        label: "なし" },
                  { v: "daily",   label: "毎日" },
                  { v: "weekly",  label: "毎週" },
                  { v: "monthly", label: "毎月" },
                ] as const).map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRecurrence(v as Recurrence | "")}
                    className="flex-1 py-1.5 rounded-lg text-[10px] border transition-all"
                    style={{
                      background: recurrence === v ? "rgba(58,111,201,0.15)" : "transparent",
                      borderColor: recurrence === v ? "var(--accent)" : "var(--border)",
                      color: recurrence === v ? "var(--accent)" : "var(--dim)",
                      fontWeight: recurrence === v ? 600 : 400,
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs mb-1.5 block text-dim">タグ</label>
              <input className="input-field text-xs" placeholder="仕事, 個人" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          {projects.length > 0 && (
            <div>
              <label className="text-xs mb-1.5 block text-dim">プロジェクト</label>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setProjectId("")}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: !projectId ? "rgba(255,255,255,0.08)" : "transparent",
                    borderColor: !projectId ? "rgba(255,255,255,0.3)" : "var(--border)",
                    color: !projectId ? "white" : "var(--dim)",
                  }}>
                  なし
                </button>
                {projects.map((p) => (
                  <button key={p.id} type="button" onClick={() => setProjectId(p.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                    style={{
                      background: projectId === p.id ? `${p.color}18` : "transparent",
                      borderColor: projectId === p.id ? p.color : "var(--border)",
                      color: projectId === p.id ? p.color : "var(--dim)",
                    }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
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
