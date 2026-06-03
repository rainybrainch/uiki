"use client"

import { useState, useTransition } from "react"
import { updateDreamProgress, achieveDream, deleteDream, updateDream } from "@/actions/dreams"
import { CheckCircle2, Circle, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react"

const FIELD_LABELS = [
  { key: "definition",  label: "定義" },
  { key: "vision",      label: "目的/ビジョン" },
  { key: "vow",         label: "誓約" },
  { key: "constraints", label: "制約" },
  { key: "period",      label: "期間" },
  { key: "kpi",         label: "評価軸/KPI" },
  { key: "connections", label: "相互関連性" },
] as const

export function DreamList({ byCategory, done, catColors, catLabels }: {
  byCategory: { cat: string; label: string; color: string; dreams: any[] }[]
  done: any[]
  catColors: Record<string, string>
  catLabels: Record<string, string>
}) {
  return (
    <div className="space-y-8">
      {byCategory.map(({ cat, label, color, dreams }) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <h3 className="text-sm font-medium" style={{ color }}>{label}</h3>
            <span className="text-xs font-mono text-faint">{dreams.length}世界</span>
          </div>
          <div className="space-y-2">
            {dreams.map((d) => <DreamCard key={d.id} dream={d} color={color} />)}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
            <h3 className="text-sm font-medium" style={{ color: "#4ade80" }}>達成済み</h3>
            <span className="text-xs font-mono text-faint">{done.length}世界</span>
          </div>
          <div className="space-y-2 opacity-60">
            {done.map((d) => <DreamCard key={d.id} dream={d} color="#4ade80" achieved />)}
          </div>
        </div>
      )}
    </div>
  )
}

function DreamCard({ dream, color, achieved = false }: { dream: any; color: string; achieved?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [prog, setProg] = useState(String(dream.progress))
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const filledCount = FIELD_LABELS.filter(({ key }) => dream[key]).length

  const handleProgress = () => {
    startTransition(async () => {
      await updateDreamProgress(dream.id, Number(prog))
      setEditing(false)
    })
  }

  const handleAchieve = () => {
    if (!confirm(`「${dream.title}」を達成済みにしますか？`)) return
    startTransition(() => achieveDream(dream.id))
  }

  const handleDelete = () => {
    if (!confirm(`「${dream.title}」を削除しますか？`)) return
    startTransition(() => deleteDream(dream.id))
  }

  const handleSaveField = (key: string) => {
    startTransition(async () => {
      await updateDream(dream.id, { [key]: editFields[key] ?? dream[key] })
      setEditFields((prev) => { const n = { ...prev }; delete n[key]; return n })
    })
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}22`, background: `${color}08` }}>
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
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${color}22`, color }}>
                  L{dream.layer}
                </span>
              )}
              <p className={`text-sm font-medium ${achieved ? "line-through text-dim" : ""}`}>
                {dream.title}
              </p>
              {filledCount > 0 && (
                <span className="text-[10px] text-faint">{filledCount}/7</span>
              )}
            </div>

            {/* ビジョン（常時表示） */}
            {dream.vision && !expanded && (
              <p className="text-xs text-dim line-clamp-1 mb-2">{dream.vision}</p>
            )}

            {/* プログレス */}
            {!achieved && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--faint)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${dream.progress}%`, background: color }} />
                </div>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input value={prog} onChange={(e) => setProg(e.target.value)} type="number" min="0" max="100"
                      className="w-14 text-xs px-1 py-0.5 rounded"
                      style={{ background: "var(--faint)", border: "1px solid var(--border)", color: "white" }} />
                    <button onClick={handleProgress} disabled={isPending}
                      className="text-xs px-2 py-0.5 rounded" style={{ background: `${color}22`, color }}>
                      確定
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditing(true)} className="text-xs font-mono text-dim hover:text-white">
                    {dream.progress}%
                  </button>
                )}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-dim hover:text-white transition-colors"
              title={expanded ? "閉じる" : "詳細"}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {!achieved && (
              <button onClick={handleAchieve} disabled={isPending}
                className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}>
                ✓
              </button>
            )}
            <button onClick={handleDelete} disabled={isPending}
              className="p-1 text-faint hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* 展開パネル — 8フィールド */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${color}15` }}>
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
                    <div className="flex gap-2">
                      <textarea
                        value={val}
                        onChange={(e) => setEditFields((p) => ({ ...p, [key]: e.target.value }))}
                        rows={2}
                        className="input-base text-xs resize-none flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <button onClick={() => handleSaveField(key)} disabled={isPending}
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: `${color}22`, color }}>保存</button>
                        <button onClick={() => setEditFields((p) => { const n = { ...p }; delete n[key]; return n })}
                          className="text-xs px-2 py-1 rounded text-dim"
                          style={{ border: "1px solid var(--border)" }}>✕</button>
                      </div>
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
