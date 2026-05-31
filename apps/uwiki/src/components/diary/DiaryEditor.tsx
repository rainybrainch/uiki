"use client"

import { useState, useEffect, useTransition } from "react"
import { saveDiaryEntry, deleteDiaryEntry } from "@/actions/diary"
import { formatDisplay } from "@/lib/date"
import { Save, Trash2 } from "lucide-react"

type Entry = { id: string; date: string; title: string; content: string } | null

export function DiaryEditor({ date, entry }: { date: string; entry: Entry }) {
  const [title, setTitle] = useState(entry?.title ?? "")
  const [content, setContent] = useState(entry?.content ?? "")
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  // 日付・エントリが変わったら状態をリセット（useEffect で安全に）
  useEffect(() => {
    setTitle(entry?.title ?? "")
    setContent(entry?.content ?? "")
    setSaved(false)
  }, [date, entry?.id])

  const save = () => {
    if (!title.trim() && !content.trim()) return
    startTransition(async () => {
      await saveDiaryEntry({ date, title: title.trim() || "無題", content })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const remove = () => {
    if (!entry) return
    startTransition(() => deleteDiaryEntry(entry.id))
    setTitle("")
    setContent("")
  }

  return (
    <div className="surface rounded-xl flex flex-col" style={{ minHeight: "480px" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm font-mono text-dim">{formatDisplay(date)}</span>
        <div className="flex items-center gap-2">
          {entry && (
            <button onClick={remove} className="p-1.5 rounded hover:bg-[var(--faint)] transition-colors text-dim">
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={save}
            disabled={pending || (!title.trim() && !content.trim())}
            className="flex items-center gap-1.5 btn-primary text-xs py-1.5"
          >
            <Save size={13} />
            {saved ? "保存済み" : "保存"}
          </button>
        </div>
      </div>

      <input
        className="px-5 py-4 bg-transparent outline-none text-lg font-serif font-light placeholder:text-[var(--faint)]"
        placeholder="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="flex-1 px-5 pb-6 bg-transparent outline-none text-sm leading-relaxed resize-none placeholder:text-[var(--faint)]"
        placeholder="今日のことを書く..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault()
            save()
          }
        }}
      />
    </div>
  )
}
