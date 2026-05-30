"use client"

import { useState, useTransition } from "react"
import { createLibraryItem } from "@/actions/library"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"
import type { ItemType } from "@ameiki/database"

export function LibraryAddForm({ typeLabels }: { typeLabels: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ItemType>("BOOK")
  const [title, setTitle] = useState("")
  const [creator, setCreator] = useState("")
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createLibraryItem({
        type,
        title: title.trim(),
        creator: creator || undefined,
        url: url || undefined,
        note: note || undefined,
      })
      setTitle("")
      setCreator("")
      setUrl("")
      setNote("")
      setOpen(false)
    })
  }

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Plus size={16} strokeWidth={1.5} style={{ color: "var(--dim)" }} />
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--dim)]"
          placeholder="タイトルを追加..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
        />
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded hover:bg-[var(--faint)]"
          style={{ color: "var(--dim)" }}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {open && (
        <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--dim)" }}>種類</label>
              <select
                className="input-field text-xs"
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
              >
                {Object.entries(typeLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--dim)" }}>
                {type === "BOOK" ? "著者" : type === "MOVIE" ? "監督" : type === "MUSIC" ? "アーティスト" : "作者 / 発信元"}
              </label>
              <input
                className="input-field text-xs"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
              />
            </div>
          </div>
          {(type === "YOUTUBE" || type === "ARTICLE" || type === "URL") && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--dim)" }}>URL</label>
              <input
                className="input-field text-xs"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--dim)" }}>メモ</label>
            <textarea
              className="input-field text-xs resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>キャンセル</button>
            <button
              className="btn-primary text-xs"
              onClick={submit}
              disabled={pending || !title.trim()}
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
