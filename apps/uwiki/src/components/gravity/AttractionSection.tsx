"use client"

import { useState, useTransition } from "react"
import { createAttractionMetric, recordAttractionValue } from "@/actions/gravity"

export function AttractionSection({ metrics }: { metrics: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [target, setTarget] = useState("")
  const [unit, setUnit] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      await createAttractionMetric({ name: name.trim(), target: target ? Number(target) : undefined, unit: unit || undefined })
      setName(""); setTarget(""); setUnit("")
      setShowForm(false)
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#3a6fc9" }} />
          <h2 className="text-sm font-medium" style={{ color: "#3a6fc9" }}>引力雨域</h2>
          <span className="text-xs text-faint">— 外向きの数値・客観指標</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-dim hover:text-white transition-colors"
        >
          + 項目追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="surface rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="項目名（例: 貯金）" className="col-span-1 input-base" />
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="目標値" type="number" className="input-base" />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="単位（円・kg）" className="input-base" />
          </div>
          <button type="submit" disabled={!name.trim() || isPending} className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40" style={{ background: "rgba(58,111,201,0.15)", color: "#3a6fc9", border: "1px solid rgba(58,111,201,0.3)" }}>
            追加
          </button>
        </form>
      )}

      {metrics.length === 0 ? (
        <div className="surface rounded-xl py-12 text-center">
          <p className="text-sm text-faint">引力の項目をまだ追加していない</p>
        </div>
      ) : (
        <div className="space-y-3">
          {metrics.map((m) => (
            <MetricCard key={m.id} metric={m} />
          ))}
        </div>
      )}
    </section>
  )
}

function MetricCard({ metric }: { metric: any }) {
  const [value, setValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const latestLog = metric.logs[metric.logs.length - 1]
  const current = latestLog?.value ?? metric.value
  const pct = metric.target ? Math.min(100, Math.round((current / metric.target) * 100)) : null

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    startTransition(async () => {
      await recordAttractionValue({ metricId: metric.id, value: Number(value) })
      setValue("")
    })
  }

  return (
    <div className="surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">{metric.name}</span>
        <span className="text-lg font-serif font-light" style={{ color: "#3a6fc9" }}>
          {current ?? "—"}{metric.unit && <span className="text-xs text-dim ml-1">{metric.unit}</span>}
        </span>
      </div>
      {pct !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-dim">目標: {metric.target}{metric.unit}</span>
            <span className="text-xs font-mono" style={{ color: "#3a6fc9" }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "var(--faint)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#3a6fc9" }} />
          </div>
        </div>
      )}
      <form onSubmit={handleRecord} className="flex items-center gap-2 mt-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
          placeholder="記録する"
          className="flex-1 input-base text-xs"
        />
        <button type="submit" disabled={!value || isPending} className="px-3 py-1 rounded-lg text-xs transition-opacity disabled:opacity-40" style={{ background: "rgba(58,111,201,0.15)", color: "#3a6fc9" }}>
          記録
        </button>
      </form>
    </div>
  )
}
