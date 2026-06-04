"use client"

import { useState } from "react"
import { Plus, X, Loader2, ExternalLink } from "lucide-react"

export function AddEventButton({ defaultDate }: { defaultDate?: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState("")
  const [allDay, setAllDay] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string; htmlLink?: string } | null>(null)

  const submit = async () => {
    if (!title.trim()) return
    setLoading(true)
    setResult(null)
    const res = await fetch("/api/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, allDay, description }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.ok) {
      setTitle("")
      setDescription("")
      setTimeout(() => { setOpen(false); setResult(null) }, 2000)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
        style={{ background: "rgba(201,168,76,0.12)", color: "var(--amber)", border: "1px solid rgba(201,168,76,0.3)" }}
      >
        <Plus size={12} /> イベントを追加
      </button>
    )
  }

  return (
    <div className="rounded-xl p-4 animate-fade-in-fast"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "var(--amber)" }}>Google Calendar に追加</span>
        <button onClick={() => { setOpen(false); setResult(null) }}
          className="p-0.5 text-faint hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        <input
          className="input-field text-sm w-full"
          placeholder="イベント名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
          autoFocus
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="input-field text-sm flex-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="flex items-center gap-1.5 text-xs text-dim cursor-pointer shrink-0">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
              className="w-3.5 h-3.5" />
            終日
          </label>
        </div>
        <input
          className="input-field text-sm w-full"
          placeholder="メモ（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        {result?.error && <p className="text-xs" style={{ color: "var(--red)" }}>{result.error}</p>}
        {result?.ok && (
          <a href={result.htmlLink} target="_blank" rel="noopener noreferrer"
            className="text-xs flex items-center gap-1" style={{ color: "var(--green)" }}>
            <ExternalLink size={10} /> 追加しました
          </a>
        )}
        {!result && <span />}
        <button
          onClick={submit}
          disabled={loading || !title.trim()}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          追加
        </button>
      </div>
    </div>
  )
}
