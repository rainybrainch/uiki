"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { saveDiaryEntry, deleteDiaryEntry } from "@/actions/diary"
import { formatDisplay } from "@/lib/date"
import { Save, Trash2, Check } from "lucide-react"

type Entry = { id: string; date: string; title: string; content: string } | null

export function DiaryEditor({ date, entry }: { date: string; entry: Entry }) {
  const [title, setTitle]   = useState(entry?.title ?? "")
  const [content, setContent] = useState(entry?.content ?? "")
  const [status, setStatus]  = useState<"idle" | "saving" | "saved">("idle")
  const [pending, startTransition] = useTransition()
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(entry?.title ?? "")
    setContent(entry?.content ?? "")
    setStatus("idle")
  }, [date, entry?.id])

  const save = (t = title, c = content) => {
    if (!t.trim() && !c.trim()) return
    setStatus("saving")
    startTransition(async () => {
      await saveDiaryEntry({ date, title: t.trim() || "無題", content: c })
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2000)
    })
  }

  // 自動保存（入力が止まって1.5秒後）
  const scheduleAutoSave = (t: string, c: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      if (t.trim() || c.trim()) save(t, c)
    }, 1500)
  }

  const handleTitleChange = (v: string) => {
    setTitle(v); setStatus("idle")
    scheduleAutoSave(v, content)
  }
  const handleContentChange = (v: string) => {
    setContent(v); setStatus("idle")
    scheduleAutoSave(title, v)
  }

  const remove = () => {
    if (!entry) return
    startTransition(async () => { await deleteDiaryEntry(entry.id) })
    setTitle(""); setContent("")
  }

  return (
    <div className="surface rounded-xl flex flex-col" style={{ minHeight: "min(480px, 60vh)" }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-sm font-mono text-dim">{formatDisplay(date)}</span>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
              <Check size={11} /> 保存
            </span>
          )}
          {status === "saving" && (
            <span className="text-xs text-dim">保存中...</span>
          )}
          {entry && (
            <button onClick={remove}
              className="p-1.5 rounded hover:bg-[var(--faint)] transition-colors text-faint hover:text-red-400">
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={() => save()}
            disabled={pending || (!title.trim() && !content.trim())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40"
            style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.2)" }}>
            <Save size={11} /> 保存
          </button>
        </div>
      </div>

      {/* タイトル */}
      <div className="px-4 pt-4 pb-2">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="タイトル"
          className="w-full bg-transparent text-base font-medium outline-none placeholder:text-faint"
          style={{ color: "var(--text)" }}
        />
      </div>

      {/* 本文 */}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="今日のことを書く..."
        className="flex-1 px-4 pb-4 bg-transparent text-sm outline-none resize-none leading-relaxed placeholder:text-faint"
        style={{ color: "var(--text)", minHeight: 200 }}
      />
    </div>
  )
}
