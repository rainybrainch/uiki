"use client"

import { useState, useEffect, useTransition, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { searchAll } from "@/actions/tasks"
import { Search, CheckSquare, BookOpen, Library, Briefcase, Layers } from "lucide-react"
import clsx from "clsx"

type Results = Awaited<ReturnType<typeof searchAll>>
type FlatItem = { id: string; title: string; sub?: string; href: string }

function buildFlatItems(results: Results | null): FlatItem[] {
  if (!results) return []
  return [
    ...results.tasks.map((t) => ({ id: t.id, title: t.title, sub: t.memo ?? undefined, href: `/tasks/${t.id}` })),
    ...results.diary.map((d) => ({ id: d.id, title: d.title, sub: d.date, href: `/diary?date=${d.date}` })),
    ...results.library.map((l) => ({ id: l.id, title: l.title, sub: l.creator ?? undefined, href: "/library" })),
    ...(results.cases ?? []).map((c) => ({ id: c.id, title: c.name, sub: c.client ?? undefined, href: "/cases" })),
    ...(results.dreams ?? []).map((d) => ({ id: d.id, title: d.title, sub: `No.${(d as any).layer ?? ""} ${d.vision?.slice(0, 35) ?? ""}`.trim(), href: `/dreams#dream-${d.id}` })),
  ]
}

export function QuickSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Results | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const flatItems = buildFlatItems(results)

  const close = useCallback(() => {
    setOpen(false); setQuery(""); setResults(null); setSelectedIndex(-1)
  }, [])

  const navigate = useCallback((href: string) => {
    router.push(href); close()
  }, [router, close])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v) }
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [close])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    setSelectedIndex(-1)
    if (!query.trim()) { setResults(null); return }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAll(query)
        setResults(r)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (selectedIndex < 0) return
    const el = listRef.current?.querySelectorAll("[data-result-item]")[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!open) return null

  const hasResults = flatItems.length > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && flatItems[selectedIndex]) navigate(flatItems[selectedIndex].href)
    }
  }

  const taskCount  = results?.tasks.length ?? 0
  const diaryCount = results?.diary.length ?? 0
  const libCount   = results?.library.length ?? 0
  const caseCount  = (results?.cases ?? []).length
  const dreamCount = (results?.dreams ?? []).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-20 px-3 md:px-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={close}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ background: "var(--surface2)", border: "1px solid var(--border-h)" }}
        onClick={(e) => e.stopPropagation()}>

        {/* 検索入力 */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search size={16} className="text-dim shrink-0" />
          <input ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-dim"
            placeholder="タスク・日記・案件・百層世界・ライブラリを検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2">
            {pending && <div className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin" />}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded text-faint" style={{ background: "var(--faint)" }}>Esc</kbd>
          </div>
        </div>

        {/* 結果 */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {!query && (
            <div className="py-8 text-center">
              <p className="text-xs text-faint mb-2">キーワードを入力</p>
              <p className="text-[10px] text-faint">タスク / 日記 / ライブラリ / 案件 / 百層世界</p>
            </div>
          )}
          {query && !hasResults && !pending && (
            <p className="text-xs text-center py-8 text-faint">「{query}」の結果はありません</p>
          )}

          {results?.tasks.length ? (
            <ResultSection icon={<CheckSquare size={11} />} label="タスク" color="var(--accent)"
              items={flatItems.slice(0, taskCount)}
              selectedIndex={selectedIndex} indexOffset={0}
              onSelect={(href) => navigate(href)} />
          ) : null}

          {results?.diary.length ? (
            <ResultSection icon={<BookOpen size={11} />} label="日記" color="var(--amber)"
              items={flatItems.slice(taskCount, taskCount + diaryCount)}
              selectedIndex={selectedIndex} indexOffset={taskCount}
              onSelect={(href) => navigate(href)} />
          ) : null}

          {results?.library.length ? (
            <ResultSection icon={<Library size={11} />} label="ライブラリ" color="var(--dim)"
              items={flatItems.slice(taskCount + diaryCount, taskCount + diaryCount + libCount)}
              selectedIndex={selectedIndex} indexOffset={taskCount + diaryCount}
              onSelect={(href) => navigate(href)} />
          ) : null}

          {(results?.cases ?? []).length ? (
            <ResultSection icon={<Briefcase size={11} />} label="案件" color="#c9a84c"
              items={flatItems.slice(taskCount + diaryCount + libCount, taskCount + diaryCount + libCount + caseCount)}
              selectedIndex={selectedIndex} indexOffset={taskCount + diaryCount + libCount}
              onSelect={(href) => navigate(href)} />
          ) : null}

          {(results?.dreams ?? []).length ? (
            <ResultSection icon={<Layers size={11} />} label="百層世界" color="#8b5cf6"
              items={flatItems.slice(taskCount + diaryCount + libCount + caseCount)}
              selectedIndex={selectedIndex} indexOffset={taskCount + diaryCount + libCount + caseCount}
              onSelect={(href) => navigate(href)} />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ResultSection({ icon, label, color, items, selectedIndex, indexOffset, onSelect }: {
  icon: React.ReactNode; label: string; color: string
  items: FlatItem[]; selectedIndex: number; indexOffset: number
  onSelect: (href: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] font-mono tracking-wider text-faint uppercase">{label}</span>
      </div>
      {items.map((item, i) => {
        const idx = indexOffset + i
        const active = idx === selectedIndex
        return (
          <button key={item.id} data-result-item onClick={() => onSelect(item.href)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
            style={{ background: active ? "rgba(58,111,201,0.12)" : "transparent" }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)" }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.title}</p>
              {item.sub && <p className="text-xs text-faint truncate">{item.sub}</p>}
            </div>
          </button>
        )
      })}
    </div>
  )
}
