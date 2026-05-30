"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { searchAll } from "@/actions/tasks"
import { Search, CheckSquare, BookOpen, Library, X } from "lucide-react"
import clsx from "clsx"

type Results = Awaited<ReturnType<typeof searchAll>>

export function QuickSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Results | null>(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // ⌘K / Ctrl+K で開く
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAll(query)
        setResults(r)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  if (!open) return null

  const hasResults = results && (results.tasks.length + results.diary.length + results.library.length) > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ background: "var(--surface2)", border: "1px solid var(--border-h)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 検索入力 */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search size={16} className="text-dim shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-dim"
            placeholder="タスク、日記、ライブラリを検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {pending && <div className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin" />}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded text-faint" style={{ background: "var(--faint)" }}>Esc</kbd>
          </div>
        </div>

        {/* 結果 */}
        <div className="max-h-80 overflow-y-auto">
          {!query && (
            <p className="text-xs text-center py-8 text-faint">キーワードを入力してください</p>
          )}

          {query && !hasResults && !pending && (
            <p className="text-xs text-center py-8 text-faint">「{query}」の結果はありません</p>
          )}

          {results?.tasks.length ? (
            <ResultSection
              icon={<CheckSquare size={12} />}
              label="タスク"
              items={results.tasks.map((t) => ({ id: t.id, title: t.title, sub: t.memo ?? undefined, href: "/tasks" }))}
              onSelect={() => setOpen(false)}
              router={router}
            />
          ) : null}

          {results?.diary.length ? (
            <ResultSection
              icon={<BookOpen size={12} />}
              label="日記"
              items={results.diary.map((d) => ({ id: d.id, title: d.title, sub: d.date, href: `/diary?date=${d.date}` }))}
              onSelect={() => setOpen(false)}
              router={router}
            />
          ) : null}

          {results?.library.length ? (
            <ResultSection
              icon={<Library size={12} />}
              label="ライブラリ"
              items={results.library.map((l) => ({ id: l.id, title: l.title, sub: l.creator ?? undefined, href: "/library" }))}
              onSelect={() => setOpen(false)}
              router={router}
            />
          ) : null}
        </div>

        {/* フッター */}
        <div
          className="flex items-center justify-between px-4 py-2.5 text-[10px] text-faint"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span>Enter で移動</span>
          <span>⌘K で開く</span>
        </div>
      </div>
    </div>
  )
}

function ResultSection({
  icon, label, items, onSelect, router,
}: {
  icon: React.ReactNode
  label: string
  items: { id: string; title: string; sub?: string; href: string }[]
  onSelect: () => void
  router: ReturnType<typeof useRouter>
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium text-dim"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--faint)] transition-colors"
          onClick={() => { router.push(item.href); onSelect() }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{item.title}</p>
            {item.sub && <p className="text-xs text-dim mt-0.5 truncate">{item.sub}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}
