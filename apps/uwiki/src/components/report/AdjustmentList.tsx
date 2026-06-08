"use client"

import type { AdjustmentLog, Dream } from "@uwiki/database"
import { useState, useTransition } from "react"
import { createAdjustment, updateAdjustmentResult, deleteAdjustment } from "@/actions/adjustments"
import { Plus, Trash2, Pencil } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export function AdjustmentList({ adjustments, dreams }: { adjustments: AdjustmentLog[]; dreams: Dream[] }) {
  const [open, setOpen] = useState(false)
  const [what, setWhat] = useState("")
  const [why, setWhy]   = useState("")
  const [dream, setDream] = useState("")
  const [isPending, startTransition] = useTransition()

  const monthly = adjustments.filter((a) => a.type === "MONTHLY")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!what.trim()) return
    startTransition(async () => {
      await createAdjustment({ type: "MONTHLY", what: what.trim(), why: why || undefined, relatedDream: dream || undefined })
      setWhat(""); setWhy(""); setDream(""); setOpen(false)
    })
  }

  return (
    <div className="surface rounded-xl p-5 animate-fade-in delay-200">
      <div className="flex items-center justify-between mb-4">
        <p className="section-label mb-0">月次 Act — 修正ログ</p>
        <button onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "rgba(201,168,76,0.12)", color: "var(--amber)", border: "1px solid rgba(201,168,76,0.25)" }}>
          <Plus size={11} /> 修正を記録
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-xl"
          style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="space-y-2 mb-3">
            <textarea value={what} onChange={(e) => setWhat(e.target.value)}
              placeholder="何を変えたか *" rows={2}
              className="input-base text-xs resize-none" required />
            <textarea value={why} onChange={(e) => setWhy(e.target.value)}
              placeholder="なぜ変えたか（任意）" rows={2}
              className="input-base text-xs resize-none" />
            {dreams.length > 0 && (
              <select value={dream} onChange={(e) => setDream(e.target.value)} className="input-base text-xs">
                <option value="">関連する世界（任意）</option>
                {dreams.filter((d) => d.id && d.title).map((d) => (
                  <option key={d.id} value={d.title}>{d.title}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!what.trim() || isPending}
              className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "var(--amber)", color: "#060c1a" }}>
              記録する
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg text-xs text-dim"
              style={{ border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {monthly.length === 0 ? (
        <p className="text-sm text-faint text-center py-6">まだ月次修正の記録がありません</p>
      ) : (
        <div className="space-y-3">
          {monthly.map((a) => (
            <AdjCard key={a.id} adj={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AdjCard({ adj }: { adj: AdjustmentLog }) {
  const [editResult, setEditResult] = useState(false)
  const [result, setResult] = useState(adj.result ?? "")
  const [isPending, startTransition] = useTransition()

  const handleSaveResult = () => {
    startTransition(async () => {
      await updateAdjustmentResult(adj.id, result)
      setEditResult(false)
    })
  }

  const handleDelete = () => {
    startTransition(() => deleteAdjustment(adj.id))
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-faint">
              {format(new Date(adj.createdAt), "M月d日", { locale: ja })}
            </span>
            {adj.relatedDream && (
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(201,168,76,0.15)", color: "var(--amber)" }}>
                {adj.relatedDream}
              </span>
            )}
          </div>
          <p className="text-sm font-medium mb-1">{adj.what}</p>
          {adj.why && <p className="text-xs text-dim">理由: {adj.why}</p>}
        </div>
        <ConfirmButton onConfirm={handleDelete} disabled={isPending} size="xs" className="p-1 shrink-0" />
      </div>

      {/* 結果フィールド */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.15)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-faint">結果はどうだったか</span>
          {!editResult && (
            <button onClick={() => setEditResult(true)} className="p-0.5 text-faint hover:text-white transition-colors">
              <Pencil size={10} />
            </button>
          )}
        </div>
        {editResult ? (
          <div className="flex gap-2">
            <textarea value={result} onChange={(e) => setResult(e.target.value)}
              rows={2} className="input-base text-xs resize-none flex-1" />
            <div className="flex flex-col gap-1">
              <button onClick={handleSaveResult} disabled={isPending}
                className="text-xs px-2 py-1 rounded"
                style={{ background: "rgba(201,168,76,0.2)", color: "var(--amber)" }}>保存</button>
              <button onClick={() => setEditResult(false)}
                className="text-xs px-2 py-1 rounded text-dim"
                style={{ border: "1px solid var(--border)" }}>✕</button>
            </div>
          </div>
        ) : (
          <p className={`text-xs leading-relaxed ${adj.result ? "" : "text-faint italic"}`}>
            {adj.result || "未記録"}
          </p>
        )}
      </div>
    </div>
  )
}
