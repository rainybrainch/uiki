"use client"

import { useState, useTransition, useRef } from "react"
import { format } from "date-fns"
import { createLibraryItem } from "@/actions/library"
import { polishText, generateYomuPost, generateBooklogReview } from "@/actions/ai-write"
import { AiPolishButton } from "@/components/ui/AiPolishButton"
import { Plus, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import type { ItemType, ItemStatus } from "@uwiki/database"

const YOMU_GIST_ID = "cffc5abcf62103b27effe2efba25ca6a"

export function LibraryAddForm({ typeLabels }: { typeLabels: Record<string, string> }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ItemType>("BOOK")
  const [status, setStatus] = useState<ItemStatus>("WANT")
  const [title, setTitle] = useState("")
  const [creator, setCreator] = useState("")
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [tags, setTags] = useState("")
  const [pending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      await createLibraryItem({
        type,
        status,
        title: title.trim(),
        creator: creator || undefined,
        url: url || undefined,
        note: note || undefined,
        tags: tags || undefined,
        finishedAt: status === "DONE" ? format(new Date(), "yyyy-MM-dd") : undefined,
      })
      setTitle("")
      setCreator("")
      setUrl("")
      setNote("")
      setTags("")
      setOpen(false)
      setTimeout(() => titleRef.current?.focus(), 0)
    })
  }

  return (
    <div className="surface rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Plus size={16} strokeWidth={1.5} style={{ color: "var(--dim)" }} />
        <input
          ref={titleRef}
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
          {/* 種類グリッド */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--dim)" }}>種類</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(typeLabels).map(([v, l]) => {
                const emoji = l.split(" ")[0]
                const name = l.split(" ").slice(1).join(" ")
                const active = type === v
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setType(v as ItemType)}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] border transition-all"
                    style={{
                      background: active ? "rgba(58,111,201,0.15)" : "transparent",
                      borderColor: active ? "var(--accent)" : "var(--border)",
                      color: active ? "white" : "var(--dim)",
                    }}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span>{name}</span>
                  </button>
                )
              })}
            </div>
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
          {/* ステータス */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--dim)" }}>ステータス</label>
            <div className="flex gap-2">
              {([
                { v: "WANT", label: "積んでる", color: "rgba(255,255,255,0.45)" },
                { v: "DOING", label: "進行中",  color: "var(--accent)" },
                { v: "DONE", label: "完了",    color: "#4ade80" },
              ] as const).map(({ v, label, color }) => (
                <button key={v} type="button" onClick={() => setStatus(v)}
                  className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: status === v ? `${color}18` : "transparent",
                    borderColor: status === v ? color : "var(--border)",
                    color: status === v ? color : "var(--dim)",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs" style={{ color: "var(--dim)" }}>メモ・感想</label>
              <AiPolishButton
                onPolish={() => polishText(note, `${type}: ${title}`)}
                onResult={setNote}
              />
            </div>
            <textarea
              className="input-field text-xs resize-none"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="走り書きでOK。AI整形できます"
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--dim)" }}>タグ（カンマ区切り）</label>
            <input
              className="input-field text-xs"
              placeholder="読書, 技術, 2026"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* AI アクション */}
          {(type === "BOOK" || type === "MOVIE" || type === "MUSIC" || type === "GAME") && note && title && (
            <div className="flex flex-wrap gap-2 pt-1">
              {/* 読雨へ投稿 */}
              <AiPolishButton
                label="読雨に投稿"
                onPolish={async () => {
                  const typeLabel = { BOOK: "本", MOVIE: "映画", MUSIC: "音楽", GAME: "ゲーム" }[type] ?? type
                  const res = await generateYomuPost({ title, type: typeLabel, rawImpression: note })
                  const params = new URLSearchParams({
                    raw: res.text, title, site: typeLabel,
                    stars: String(res.stars), tags: res.tags,
                  })
                  window.open(`https://rainybrainch.github.io/yomu/?${params}`, "_blank")
                  return ""
                }}
                onResult={() => {}}
              />
              {/* ブクログ向けレビュー */}
              {type === "BOOK" && (
                <AiPolishButton
                  label="ブクログ用レビュー生成"
                  onPolish={async () => {
                    const review = await generateBooklogReview({ title, author: creator, rawImpression: note })
                    setNote(review)
                    return ""
                  }}
                  onResult={() => {}}
                />
              )}
            </div>
          )}

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
