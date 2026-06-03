"use client"

import { useState, useTransition } from "react"
import { createDream } from "@/actions/dreams"
import { Plus } from "lucide-react"

export function DreamForm({ catLabels }: { catLabels: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("OTHER")
  const [layer, setLayer] = useState("")
  const [isPending, startTransition] = useTransition()

  const reset = () => { setTitle(""); setDescription(""); setCategory("OTHER"); setLayer(""); setOpen(false) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      await createDream({ title: title.trim(), description: description || undefined, category, layer: layer ? Number(layer) : undefined })
      reset()
    })
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
      style={{ background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#8b5cf6" }}
    >
      <Plus size={15} /> 目標を追加（層を掘る）
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-5" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="目標タイトル *" required className="col-span-2 input-base" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
          {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={layer} onChange={(e) => setLayer(e.target.value)} type="number" min="1" max="100" placeholder="層番号（1〜100）" className="input-base" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細・説明（任意）" rows={2} className="col-span-2 input-base resize-none" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={!title.trim() || isPending}
          className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: "#8b5cf6", color: "white" }}
        >掘る</button>
        <button type="button" onClick={reset} className="px-4 py-2 rounded-lg text-sm text-dim" style={{ border: "1px solid var(--border)" }}>キャンセル</button>
      </div>
    </form>
  )
}
