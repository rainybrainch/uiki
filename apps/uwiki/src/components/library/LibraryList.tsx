"use client"

import { useState, useTransition, useMemo } from "react"
import { updateLibraryItem, deleteLibraryItem } from "@/actions/library"
import { ExternalLink, Star, Trash2, Search, X, ArrowUpDown } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import clsx from "clsx"
import type { ItemStatus } from "@uwiki/database"

type SortKey = "newest" | "oldest" | "rating" | "title"
const SORT_LABELS: Record<SortKey, string> = {
  newest: "新しい順", oldest: "古い順", rating: "評価順", title: "タイトル順",
}

type Item = {
  id: string
  type: string
  title: string
  creator: string | null
  url: string | null
  coverUrl: string | null
  status: ItemStatus
  rating: number | null
  note: string | null
  tags: string | null
  finishedAt: string | null
  createdAt: Date
}

const STATUS_LABELS: Record<ItemStatus, { label: string; color: string; bg: string; next: string }> = {
  WANT:  { label: "積んでる", color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.06)", next: "→ 進行中" },
  DOING: { label: "進行中",   color: "var(--accent)",          bg: "rgba(58,111,201,0.15)",  next: "→ 完了"   },
  DONE:  { label: "完了",     color: "#4ade80",                bg: "rgba(74,222,128,0.12)",  next: "→ 積んでる" },
}

export function LibraryList({ items, typeLabels }: { items: Item[]; typeLabels: Record<string, string> }) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("newest")
  const [showSort, setShowSort] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // 全アイテムからユニークタグを抽出
  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => {
      item.tags?.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => set.add(t))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"))
  }, [items])

  const filtered = useMemo(() => {
    let list = query.trim()
      ? items.filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.creator ?? "").toLowerCase().includes(query.toLowerCase()) ||
          (item.note ?? "").toLowerCase().includes(query.toLowerCase())
        )
      : [...items]

    if (activeTag) {
      list = list.filter((item) =>
        item.tags?.split(",").map((t) => t.trim()).includes(activeTag)
      )
    }

    if (sort === "oldest") list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    else if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title, "ja"))

    return list
  }, [items, query, sort, activeTag])

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-3 opacity-25">📚</div>
        <p className="text-sm text-faint mb-1">ライブラリが空です</p>
        <p className="text-xs text-faint opacity-60">読んだ本、観た映画、聴いた音楽を記録しよう。</p>
      </div>
    )
  }

  return (
    <div>
      {/* 検索 + ソート */}
      {items.length > 4 && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・作者・メモで絞り込み..."
              className="input-field pl-9 pr-8 text-sm w-full"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSort((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-all hover:bg-[var(--faint)]"
              style={{
                background: sort !== "newest" ? "rgba(58,111,201,0.1)" : "transparent",
                borderColor: sort !== "newest" ? "var(--accent)" : "var(--border)",
                color: sort !== "newest" ? "var(--accent)" : "var(--dim)",
              }}
            >
              <ArrowUpDown size={12} />
              <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden shadow-xl min-w-[120px]"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <button key={k} onClick={() => { setSort(k); setShowSort(false) }}
                    className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--faint)]"
                    style={{ color: sort === k ? "var(--accent)" : "var(--text)" }}>
                    {SORT_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="text-[10px] px-2 py-1 rounded-full transition-all"
              style={{
                background: activeTag === tag ? "rgba(58,111,201,0.2)" : "rgba(58,111,201,0.06)",
                color: activeTag === tag ? "var(--accent)" : "var(--dim)",
                border: `1px solid ${activeTag === tag ? "rgba(58,111,201,0.4)" : "var(--border)"}`,
                fontWeight: activeTag === tag ? 600 : 400,
              }}
            >
              {tag}
              {activeTag === tag && (
                <span className="ml-1 opacity-60">×</span>
              )}
            </button>
          ))}
        </div>
      )}

      {(query || activeTag) && filtered.length > 0 && (
        <p className="text-[10px] text-faint font-mono mb-3">
          {filtered.length}/{items.length}件
        </p>
      )}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-faint py-8">
          {activeTag ? `「${activeTag}」タグのアイテムがありません` : `「${query}」に一致するアイテムがありません`}
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 xl:gap-3">
          {filtered.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              typeLabels={typeLabels}
              activeTag={activeTag}
              onTagClick={(tag) => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LibraryCard({ item, typeLabels, activeTag, onTagClick }: {
  item: Item
  typeLabels: Record<string, string>
  activeTag: string | null
  onTagClick: (tag: string) => void
}) {
  const [pending, startTransition] = useTransition()

  const cycleStatus = () => {
    const next: Record<ItemStatus, ItemStatus> = { WANT: "DOING", DOING: "DONE", DONE: "WANT" }
    const nextStatus = next[item.status]
    const finishedAt = nextStatus === "DONE"
      ? new Date().toISOString().slice(0, 10)
      : nextStatus === "WANT" || nextStatus === "DOING"
      ? null
      : undefined
    startTransition(async () => { await updateLibraryItem(item.id, { status: nextStatus, ...(finishedAt !== undefined ? { finishedAt } : {}) }) })
  }

  const setRating = (r: number) => {
    startTransition(async () => { await updateLibraryItem(item.id, { rating: r === 0 || r === item.rating ? null : r }) })
  }

  const statusInfo = STATUS_LABELS[item.status]

  return (
    <div
      className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-[var(--faint)]"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* タイプアイコン / カバー画像 */}
      {item.coverUrl ? (
        <img
          src={item.coverUrl}
          alt={item.title}
          className="w-10 h-14 rounded-lg shrink-0 object-cover"
          style={{ border: "1px solid var(--border)" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xl"
          style={{ background: "rgba(58,111,201,0.1)", border: "1px solid var(--border)" }}
        >
          {typeLabels[item.type]?.charAt(0) ?? "◉"}
        </div>
      )}

      {/* メイン情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug truncate">{item.title}</p>
            {item.creator && (
              <p className="text-xs mt-0.5" style={{ color: "var(--dim)" }}>{item.creator}</p>
            )}
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1 rounded hover:bg-[var(--faint)] transition-colors"
              style={{ color: "var(--dim)" }}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>

        {item.note && (
          <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--dim)" }}>
            {item.note}
          </p>
        )}
        {item.finishedAt && (
          <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--faint)" }}>
            完了: {item.finishedAt}
          </p>
        )}

        {/* 星評価（全ステータスで表示） */}
        <div className="flex items-center gap-0.5 mt-2" role="group" aria-label="評価">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              disabled={pending}
              aria-label={`${n}点${item.rating === n ? "（選択中）" : ""}`}
              aria-pressed={item.rating === n}
              className="transition-all hover:scale-110"
            >
              <Star
                size={13}
                fill={item.rating && n <= item.rating ? "#f59e0b" : "none"}
                stroke={item.rating && n <= item.rating ? "#f59e0b" : "rgba(255,255,255,0.15)"}
              />
            </button>
          ))}
          {item.rating && (
            <button onClick={() => setRating(0)} className="text-[10px] text-faint ml-1 hover:text-white transition-colors">✕</button>
          )}
        </div>

        {/* タグ */}
        {item.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="text-[10px] px-1.5 py-0.5 rounded transition-all hover:opacity-80"
                style={{
                  background: activeTag === tag ? "rgba(58,111,201,0.25)" : "rgba(58,111,201,0.12)",
                  color: "var(--accent)",
                  fontWeight: activeTag === tag ? 600 : 400,
                  border: `1px solid ${activeTag === tag ? "rgba(58,111,201,0.4)" : "transparent"}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ステータスと操作 */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={cycleStatus}
          disabled={pending}
          aria-label={`ステータス: ${statusInfo.label}。クリックで${statusInfo.next.replace("→ ", "")}`}
          className="group/status text-[10px] px-2.5 py-1 rounded-full transition-all font-medium relative overflow-hidden"
          style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}44`, minWidth: 52 }}
        >
          <span className="group-hover/status:opacity-0 transition-opacity">{statusInfo.label}</span>
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/status:opacity-100 transition-opacity text-[9px]">
            {statusInfo.next}
          </span>
        </button>
        <ConfirmButton
          onConfirm={() => startTransition(async () => { await deleteLibraryItem(item.id) })}
          className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--faint)]"
        />
      </div>
    </div>
  )
}
