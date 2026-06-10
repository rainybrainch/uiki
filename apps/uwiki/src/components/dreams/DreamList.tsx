"use client"

import type { Dream } from "@uwiki/database"
import { useState, useTransition, useEffect } from "react"
import { updateDreamProgress, achieveDream, deleteDream, updateDream, updateDreamAxis } from "@/actions/dreams"
import { polishText } from "@/actions/ai-write"
import { AiPolishButton } from "@/components/ui/AiPolishButton"
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Pencil, ChevronRight, ExternalLink } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import Link from "next/link"
import { AXES } from "./DreamForm"

const FIELD_LABELS = [
  { key: "definition",  label: "定義" },
  { key: "vision",      label: "目的/ビジョン" },
  { key: "vow",         label: "誓約" },
  { key: "constraints", label: "制約" },
  { key: "period",      label: "期間" },
  { key: "kpi",         label: "評価軸/KPI" },
  { key: "connections", label: "相互関連性" },
] as const

function CategorySection({ cat, label, color, dreams, dreamIdByTitle }: {
  cat: string; label: string; color: string; dreams: Dream[]; dreamIdByTitle: Record<string, string>
}) {
  const storageKey = `dreams-collapsed-${cat}`
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) setCollapsed(saved === "1")
  }, [storageKey])

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(storageKey, next ? "1" : "0")
      return next
    })
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <h3 className="text-sm font-medium flex-1" style={{ color }}>{label}</h3>
        <span className="text-xs font-mono text-faint">{dreams.length}世界</span>
        {collapsed
          ? <ChevronRight size={13} style={{ color: "var(--faint)" }} />
          : <ChevronDown size={13} style={{ color: "var(--faint)" }} />
        }
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {dreams.map((d) => <DreamCard key={d.id} dream={d} color={color} dreamIdByTitle={dreamIdByTitle} />)}
        </div>
      )}
    </div>
  )
}

function AxisSection({ axisId, dreams, dreamIdByTitle }: {
  axisId: string; dreams: Dream[]; dreamIdByTitle: Record<string, string>
}) {
  const axisInfo = AXES.find((a) => a.value === axisId)
  if (!axisInfo) return null
  const storageKey = `dreams-axis-collapsed-${axisId}`
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) setCollapsed(saved === "1")
  }, [storageKey])

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(storageKey, next ? "1" : "0")
      return next
    })
  }

  const avgProg = dreams.length > 0
    ? Math.round(dreams.reduce((s, d) => s + (d.progress ?? 0), 0) / dreams.length)
    : 0

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${axisInfo.color}25`, background: `${axisInfo.color}05` }}>
      <button
        onClick={toggle}
        className="flex items-center gap-3 w-full text-left px-4 py-3"
        style={{ borderBottom: collapsed ? "none" : `1px solid ${axisInfo.color}18` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium" style={{ color: axisInfo.color }}>{axisInfo.label}</span>
            <span className="text-[10px] text-faint">{axisInfo.sub}</span>
            <span className="text-[10px] font-mono text-faint ml-auto">{dreams.length}世界</span>
          </div>
          {/* 進捗バー */}
          {dreams.length > 0 && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${avgProg}%`, background: axisInfo.color, opacity: 0.7 }} />
            </div>
          )}
        </div>
        {collapsed
          ? <ChevronRight size={13} style={{ color: "var(--faint)" }} />
          : <ChevronDown size={13} style={{ color: "var(--faint)" }} />
        }
      </button>
      {!collapsed && (
        <div className="px-4 py-3 space-y-2">
          {dreams.map((d) => (
            <DreamCard key={d.id} dream={d} color={axisInfo.color} dreamIdByTitle={dreamIdByTitle} showAxisChanger />
          ))}
        </div>
      )}
    </div>
  )
}

export function DreamList({ byCategory, done, catColors, catLabels, dreamIdByTitle = {}, byAxis }: {
  byCategory: { cat: string; label: string; color: string; dreams: Dream[] }[]
  done: Dream[]
  catColors: Record<string, string>
  catLabels: Record<string, string>
  dreamIdByTitle?: Record<string, string>
  byAxis?: { axisId: string; dreams: Dream[] }[]
}) {
  const [doneCollapsed, setDoneCollapsed] = useState(true)

  if (byAxis) {
    // 軸別表示モード
    const unclassified = byAxis.find((a) => a.axisId === "")?.dreams ?? []
    return (
      <div className="space-y-4">
        {byAxis.filter((a) => a.axisId !== "").map(({ axisId, dreams }) =>
          dreams.length > 0 ? (
            <AxisSection key={axisId} axisId={axisId} dreams={dreams} dreamIdByTitle={dreamIdByTitle} />
          ) : null
        )}

        {unclassified.length > 0 && (
          <div className="pt-2">
            <p className="text-[10px] font-mono text-faint mb-3 tracking-wider">── 軸未分類</p>
            <div className="space-y-2">
              {unclassified.map((d) => (
                <DreamCard key={d.id} dream={d} color="var(--dim)" dreamIdByTitle={dreamIdByTitle} showAxisChanger />
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div>
            <button
              onClick={() => setDoneCollapsed((v) => !v)}
              className="flex items-center gap-2 mb-3 w-full text-left"
            >
              <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
              <h3 className="text-sm font-medium flex-1" style={{ color: "#4ade80" }}>達成済み</h3>
              <span className="text-xs font-mono text-faint">{done.length}世界</span>
              {doneCollapsed
                ? <ChevronRight size={13} style={{ color: "var(--faint)" }} />
                : <ChevronDown size={13} style={{ color: "var(--faint)" }} />
              }
            </button>
            {!doneCollapsed && (
              <div className="space-y-2 opacity-60">
                {done.map((d) => <DreamCard key={d.id} dream={d} color="#4ade80" achieved dreamIdByTitle={dreamIdByTitle} />)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // フォールバック: カテゴリ別表示
  return (
    <div className="space-y-8">
      {byCategory.map(({ cat, label, color, dreams }) => (
        <CategorySection key={cat} cat={cat} label={label} color={color} dreams={dreams} dreamIdByTitle={dreamIdByTitle} />
      ))}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setDoneCollapsed((v) => !v)}
            className="flex items-center gap-2 mb-3 w-full text-left"
          >
            <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
            <h3 className="text-sm font-medium flex-1" style={{ color: "#4ade80" }}>達成済み</h3>
            <span className="text-xs font-mono text-faint">{done.length}世界</span>
            {doneCollapsed
              ? <ChevronRight size={13} style={{ color: "var(--faint)" }} />
              : <ChevronDown size={13} style={{ color: "var(--faint)" }} />
            }
          </button>
          {!doneCollapsed && (
            <div className="space-y-2 opacity-60">
              {done.map((d) => <DreamCard key={d.id} dream={d} color="#4ade80" achieved dreamIdByTitle={dreamIdByTitle} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DreamCard({ dream, color, achieved = false, dreamIdByTitle = {}, showAxisChanger = false }: {
  dream: Dream; color: string; achieved?: boolean; dreamIdByTitle?: Record<string, string>; showAxisChanger?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [prog, setProg] = useState(String(dream.progress))
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [axisChanging, setAxisChanging] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filledCount = FIELD_LABELS.filter(({ key }) => dream[key]).length

  const handleProgress = () => {
    startTransition(async () => {
      await updateDreamProgress(dream.id, Number(prog))
      setEditing(false)
    })
  }

  const handleAchieve = () => {
    startTransition(() => achieveDream(dream.id))
  }

  const handleDelete = () => {
    startTransition(() => deleteDream(dream.id))
  }

  const handleSaveField = (key: string) => {
    startTransition(async () => {
      await updateDream(dream.id, { [key]: editFields[key] ?? (dream as Record<string, unknown>)[key] })
      setEditFields((prev) => { const n = { ...prev }; delete n[key]; return n })
    })
  }

  const handleAxisChange = (newAxis: string | null) => {
    startTransition(async () => {
      await updateDreamAxis(dream.id, newAxis)
      setAxisChanging(false)
    })
  }

  return (
    <div id={`dream-${dream.id}`} className="rounded-xl overflow-hidden" style={{
      border: `1px solid ${achieved ? `${color}50` : `${color}22`}`,
      background: achieved ? `${color}12` : `${color}08`,
      scrollMarginTop: "5rem",
    }}>
      {/* ヘッダー行 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {achieved
              ? <CheckCircle2 size={16} style={{ color }} />
              : <Circle size={16} style={{ color: "var(--dim)" }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {dream.layer && (
                <span className="font-mono font-bold shrink-0"
                  style={{ fontSize: "0.7rem", color, letterSpacing: "0.05em", opacity: 0.9 }}>
                  No.{String(dream.layer).padStart(2, "0")}
                </span>
              )}
              <p className={`text-sm font-medium ${achieved ? "line-through" : ""}`}
                style={{ color: achieved ? color : "var(--text)", opacity: achieved ? 0.7 : 1 }}>
                {dream.title}
                {achieved && <span className="ml-2 text-[10px] font-mono not-italic" style={{ color }}>✓ 達成</span>}
              </p>
              {/* フィールド充填度 ドット */}
              <div className="flex items-center gap-0.5">
                {FIELD_LABELS.map(({ key }) => (
                  <span key={key} className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: dream[key] ? color : "rgba(255,255,255,0.12)" }} />
                ))}
              </div>
            </div>

            {/* 定義・ビジョン（常時表示） */}
            {!expanded && (dream.definition || dream.vision) && (
              <div className="mb-2 space-y-0.5">
                {dream.definition && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.75)" }}>{dream.definition}</p>
                )}
                {dream.vision && dream.definition && (
                  <p className="text-[10px] text-faint line-clamp-1 italic">{dream.vision}</p>
                )}
                {dream.vision && !dream.definition && (
                  <p className="text-xs text-dim line-clamp-1">{dream.vision}</p>
                )}
              </div>
            )}

            {/* プログレス */}
            {!achieved && (
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer group/bar relative"
                  style={{ background: "var(--faint)" }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                    const clamped = Math.max(0, Math.min(100, pct))
                    setProg(String(clamped))
                    startTransition(async () => { await updateDreamProgress(dream.id, clamped) })
                  }}
                  title="クリックで進捗を設定"
                >
                  <div className="h-full rounded-full transition-all pointer-events-none" style={{ width: `${dream.progress}%`, background: color }} />
                </div>
                {editing ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <input value={prog} onChange={(e) => setProg(e.target.value)} type="number" min="0" max="100"
                      className="w-12 text-xs px-1 py-0.5 rounded text-center"
                      style={{ background: "var(--faint)", border: "1px solid var(--border)", color: "white" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleProgress(); if (e.key === "Escape") setEditing(false) }}
                      autoFocus />
                    <button onClick={handleProgress} disabled={isPending}
                      className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>✓</button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="text-xs font-mono shrink-0 transition-colors hover:text-white"
                    style={{ color: dream.progress > 0 ? color : "var(--dim)", minWidth: "2.5rem", textAlign: "right" }}>
                    {dream.progress}%
                  </button>
                )}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/dreams/${dream.id}`}
              className="p-1.5 rounded-lg text-dim hover:text-white transition-colors"
              title="詳細ページ">
              <ExternalLink size={13} />
            </Link>
            <button onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-dim hover:text-white transition-colors"
              title={expanded ? "閉じる" : "詳細"}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {!achieved && (
              <ConfirmButton
                onConfirm={handleAchieve}
                disabled={isPending}
                label="達成"
                confirmLabel="達成済みにする"
                icon={<span className="text-xs">✓</span>}
                size="xs"
                className="px-2 py-1 rounded-lg"
              />
            )}
            <ConfirmButton
              onConfirm={handleDelete}
              disabled={isPending}
              size="xs"
            />
          </div>
        </div>
      </div>

      {/* 展開パネル — 8フィールド + 軸変更 */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${color}15` }}>
          {/* 軸変更UI */}
          {showAxisChanger && !achieved && (
            <div className="pt-3 pb-3" style={{ borderBottom: `1px solid ${color}10` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider text-faint uppercase">4本軸</span>
                <button onClick={() => setAxisChanging((v) => !v)}
                  className="text-[10px] text-faint hover:text-white transition-colors">
                  {axisChanging ? "閉じる" : "変更"}
                </button>
              </div>
              {!axisChanging ? (
                <p className="text-xs" style={{ color: AXES.find((a) => a.value === dream.axis)?.color ?? "var(--faint)" }}>
                  {AXES.find((a) => a.value === dream.axis)?.label ?? "未分類"}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <button type="button" onClick={() => handleAxisChange(null)} disabled={isPending}
                    className="px-2 py-1.5 rounded text-xs text-left transition-all"
                    style={!dream.axis ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }
                      : { background: "transparent", border: "1px solid var(--border)", color: "var(--dim)" }}>
                    未分類
                  </button>
                  {AXES.map((a) => (
                    <button key={a.value} type="button" onClick={() => handleAxisChange(a.value)} disabled={isPending}
                      className="px-2 py-1.5 rounded text-xs text-left transition-all"
                      style={dream.axis === a.value
                        ? { background: `${a.color}20`, border: `1px solid ${a.color}60`, color: a.color }
                        : { background: "transparent", border: "1px solid var(--border)", color: "var(--dim)" }}>
                      <span className="block font-medium">{a.label}</span>
                      <span className="block text-[10px] opacity-70">{a.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-4">
            {FIELD_LABELS.map(({ key, label }) => {
              const val = editFields[key] !== undefined ? editFields[key] : (dream[key] ?? "")
              const isEditing = key in editFields

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono tracking-wider text-faint uppercase">{label}</span>
                    {!isEditing && (
                      <button onClick={() => setEditFields((p) => ({ ...p, [key]: dream[key] ?? "" }))}
                        className="p-0.5 text-faint hover:text-white transition-colors">
                        <Pencil size={10} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-1">
                      <textarea
                        value={val}
                        onChange={(e) => setEditFields((p) => ({ ...p, [key]: e.target.value }))}
                        rows={2}
                        className="input-base text-xs resize-none w-full"
                      />
                      <div className="flex gap-1.5">
                        {val.trim() && (
                          <AiPolishButton
                            onPolish={() => polishText(val, `百層世界「${dream.title}」の${label}`)}
                            onResult={(text) => setEditFields((p) => ({ ...p, [key]: text }))}
                          />
                        )}
                        <button onClick={() => handleSaveField(key)} disabled={isPending}
                          className="flex-1 text-xs px-2 py-1.5 rounded"
                          style={{ background: `${color}22`, color }}>保存</button>
                        <button onClick={() => setEditFields((p) => { const n = { ...p }; delete n[key]; return n })}
                          className="text-xs px-3 py-1.5 rounded text-dim"
                          style={{ border: "1px solid var(--border)" }}>✕</button>
                      </div>
                    </div>
                  ) : key === "connections" && dream[key] ? (
                    <div className="flex flex-wrap gap-1.5">
                      {String(dream[key]).split(/[,、]/).map((c: string) => c.trim()).filter(Boolean).map((c: string) => {
                        const targetId = dreamIdByTitle[c]
                        return (
                          <Link key={c} href={targetId ? `/dreams#dream-${targetId}` : "/dreams"}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                            style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                            {c}
                            {targetId ? <span className="text-[8px] opacity-60">↗</span> : <ExternalLink size={8} />}
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className={`text-xs leading-relaxed ${dream[key] ? "text-text" : "text-faint italic"}`}
                      style={{ color: dream[key] ? "var(--text)" : undefined }}>
                      {dream[key] || "未記入"}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
