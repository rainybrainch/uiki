"use client"

import { useState, useEffect, useTransition, useRef, useCallback } from "react"
import { saveDiaryEntry, deleteDiaryEntry } from "@/actions/diary"
import { polishDiary } from "@/actions/ai-write"
import { AiPolishButton } from "@/components/ui/AiPolishButton"
import { formatDisplay } from "@/lib/date"
import { Save, Trash2, Check } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

type Entry = { id: string; date: string; title: string; content: string; mood?: number | null; tags?: string | null } | null

const MOODS = [
  { value: 1, emoji: "😞", label: "最悪" },
  { value: 2, emoji: "😕", label: "悪い" },
  { value: 3, emoji: "😐", label: "普通" },
  { value: 4, emoji: "🙂", label: "良い" },
  { value: 5, emoji: "😄", label: "最高" },
]

export function DiaryEditor({ date, entry }: { date: string; entry: Entry }) {
  const [title, setTitle]     = useState(entry?.title ?? "")
  const [content, setContent] = useState(entry?.content ?? "")
  const [mood, setMood]       = useState<number | null>(entry?.mood ?? null)
  const [tags, setTags]       = useState(entry?.tags ?? "")
  const [status, setStatus]   = useState<"idle" | "saving" | "saved">("idle")
  const [pending, startTransition] = useTransition()
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef({ title, content, mood, tags })
  stateRef.current = { title, content, mood, tags }

  useEffect(() => {
    setTitle(entry?.title ?? "")
    setContent(entry?.content ?? "")
    setMood(entry?.mood ?? null)
    setTags(entry?.tags ?? "")
    setStatus("idle")
  }, [date, entry?.id])

  // アンマウント時にオートセーブタイマーをクリア（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  const save = useCallback((t?: string, c?: string, m?: number | null, tg?: string) => {
    const s = stateRef.current
    const rt = t ?? s.title; const rc = c ?? s.content
    const rm = m !== undefined ? m : s.mood; const rtg = tg ?? s.tags
    if (!rt.trim() && !rc.trim()) return
    setStatus("saving")
    startTransition(async () => {
      await saveDiaryEntry({ date, title: rt.trim() || "無題", content: rc, mood: rm, tags: rtg || undefined })
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2000)
    })
  }, [date])

  // Cmd+S / Ctrl+S で保存
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [save])

  const scheduleAutoSave = (t: string, c: string, m: number | null, tg: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      if (t.trim() || c.trim()) save(t, c, m, tg)
    }, 1500)
  }

  const handleTitleChange = (v: string) => {
    setTitle(v); setStatus("idle")
    scheduleAutoSave(v, content, mood, tags)
  }
  const handleContentChange = (v: string) => {
    setContent(v); setStatus("idle")
    scheduleAutoSave(title, v, mood, tags)
  }
  const handleTagsChange = (v: string) => {
    setTags(v); setStatus("idle")
    scheduleAutoSave(title, content, mood, v)
  }
  const handleMoodChange = (v: number) => {
    const next = mood === v ? null : v
    setMood(next)
    if (title.trim() || content.trim()) save(title, content, next, tags)
  }

  const remove = () => {
    if (!entry) return
    startTransition(async () => { await deleteDiaryEntry(entry.id) })
    setTitle(""); setContent(""); setMood(null)
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
            <ConfirmButton
              onConfirm={remove}
              disabled={pending}
              confirmLabel="日記を削除"
              className="p-1.5 rounded hover:bg-[var(--faint)] transition-colors"
            />
          )}
          {content.trim() && (
            <AiPolishButton
              label="AI整形"
              onPolish={() => polishDiary(content, mood ? String(mood) : undefined)}
              onResult={(text) => { setContent(text); scheduleAutoSave(title, text, mood, tags) }}
            />
          )}
          <button onClick={() => save()}
            disabled={pending || (!title.trim() && !content.trim())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-40"
            style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.2)" }}>
            <Save size={11} /> 保存
          </button>
        </div>
      </div>

      {/* 気分スコア */}
      <div className="flex items-center px-4 pt-3 pb-1" style={{ gap: "2px" }}>
        {MOODS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => handleMoodChange(value)}
            title={label}
            className="flex-1 flex items-center justify-center text-lg leading-none transition-all rounded-lg"
            style={{
              padding: "8px 4px",
              minHeight: 40,
              opacity: mood === null ? 0.45 : mood === value ? 1 : 0.2,
              transform: mood === value ? "scale(1.2)" : "scale(1)",
              background: mood === value ? "rgba(255,255,255,0.06)" : "transparent",
            }}
          >
            {emoji}
          </button>
        ))}
        {mood !== null && (
          <span className="text-xs text-dim ml-2 shrink-0">{MOODS.find((m) => m.value === mood)?.label}</span>
        )}
      </div>

      {/* タイトル */}
      <div className="px-4 pt-2 pb-2">
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
        className="flex-1 px-4 pb-2 bg-transparent text-sm outline-none resize-none leading-relaxed placeholder:text-faint"
        style={{ color: "var(--text)", minHeight: 280 }}
      />

      {/* タグ + 文字数 */}
      <div className="px-4 pb-3 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <input
            value={tags}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="タグ（カンマ区切り: 仕事, 旅行, 気づき）"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-faint"
            style={{ color: "var(--dim)" }}
          />
          <span className="text-[10px] font-mono shrink-0 tabular-nums" style={{
            color: content.length > 800 ? "var(--amber)" : "var(--faint)",
          }}>
            {content.length.toLocaleString()}字
            {content.length >= 200 && (
              <span className="ml-1.5 opacity-60">· 約{Math.ceil(content.length / 400)}分</span>
            )}
          </span>
        </div>
        {tags && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className="text-[10px] badge">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ショートカットヒント */}
      <div className="px-4 pb-2 flex justify-end">
        <span className="text-[9px] font-mono text-faint">⌘S / Ctrl+S で保存 · 自動保存あり</span>
      </div>
    </div>
  )
}
