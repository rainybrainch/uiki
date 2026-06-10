"use client"

import type { AttractionMetric, AttractionLog } from "@uwiki/database"
import { useState, useTransition } from "react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import { createAttractionMetric, recordAttractionValue, recordSelfReport, deleteAttractionMetric } from "@/actions/gravity"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

const SELF_METRICS = [
  { key: "mood",    label: "😊 気分",  opts: ["😞 1","😐 2","🙂 3","😄 4","🤩 5"] },
  { key: "fatigue", label: "⚡ 疲労",  opts: ["完全 1","回復 2","普通 3","疲労 4","限界 5"] },
  { key: "hunger",  label: "🍽 空腹",  opts: ["満腹 1","普通 2","小腹 3","空腹 4","激空 5"] },
]

export function GravityExternal({ metrics }: { metrics: (AttractionMetric & { logs: AttractionLog[] })[] }) {
  const [showAdd, setShowAdd]     = useState(false)
  const [name, setName]           = useState("")
  const [target, setTarget]       = useState("")
  const [unit, setUnit]           = useState("")
  const [selfReport, setSelf]     = useState<Record<string, number>>({})
  const [selfPending, startSelfTransition] = useTransition()
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      await createAttractionMetric({ name: name.trim(), target: target ? Number(target) : undefined, unit: unit || undefined })
      setName(""); setTarget(""); setUnit(""); setShowAdd(false)
    })
  }

  return (
    <div style={{ maxWidth: "min(720px, 100%)", margin: "0 auto" }}>
      {/* ヘッダー */}
      <div style={{
        borderLeft: "3px solid #3a6fc9",
        padding: "0.8rem 1.2rem",
        marginBottom: "1.8rem",
        background: "rgba(58,111,201,0.04)",
        borderRadius: "0 0.4rem 0.4rem 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "1.3rem" }}>💧</span>
          <h2 style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: "1.2rem", fontWeight: 500,
            color: "#3a6fc9", letterSpacing: "0.05em",
          }}>引力雨域</h2>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--dim)", letterSpacing: "0.1em" }}>
            アナリスト（引力AI）
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--dim)", lineHeight: 1.6, margin: 0 }}>
          映った像は、嘘を吐かない。その数値だけが、ここに積もる。
        </p>
      </div>

      {/* 自己申告チップ */}
      <div style={{
        marginBottom: "1.8rem", padding: "1rem 1.2rem",
        border: "1px dashed rgba(58,111,201,0.3)",
        borderRadius: "0.4rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--dim)" }}>今の自己申告（タップで記録）</span>
          {selfPending && <span style={{ fontSize: "0.7rem", color: "var(--dim)" }}>記録中...</span>}
        </div>
        {SELF_METRICS.map(({ key, label, opts }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--dim)", minWidth: 60 }}>{label}</span>
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {opts.map((opt, i) => (
                <button
                  key={i}
                  disabled={selfPending}
                  onClick={() => {
                    const val = i + 1
                    setSelf((prev) => ({ ...prev, [key]: val }))
                    startSelfTransition(() => recordSelfReport({ label, value: val }))
                  }}
                  style={{
                    padding: "0.2rem 0.55rem",
                    fontSize: "0.72rem", borderRadius: "999px",
                    cursor: "pointer", transition: "all 0.2s ease",
                    background: selfReport[key] === i + 1 ? "rgba(58,111,201,0.2)" : "transparent",
                    border: `1px solid ${selfReport[key] === i + 1 ? "#3a6fc9" : "var(--border)"}`,
                    color: selfReport[key] === i + 1 ? "#3a6fc9" : "var(--dim)",
                    opacity: selfPending ? 0.6 : 1,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 指標一覧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
        {metrics.length === 0 ? (
          <div style={{
            padding: "2.5rem", textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)",
            borderRadius: "0.4rem",
          }}>
            <p style={{ color: "var(--dim)", fontSize: "0.85rem", fontStyle: "italic" }}>
              引力の項目をまだ追加していない
            </p>
          </div>
        ) : metrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>

      {/* 項目追加 */}
      {showAdd ? (
        <form onSubmit={handleAdd} style={{
          padding: "1rem", background: "rgba(58,111,201,0.04)",
          border: "1px solid rgba(58,111,201,0.3)", borderRadius: "0.4rem",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
            {[
              { val: name, set: setName, ph: "項目名（例: 体重・貯金）" },
              { val: target, set: setTarget, ph: "目標値" },
              { val: unit, set: setUnit, ph: "単位（kg・円）" },
            ].map(({ val, set, ph }, i) => (
              <input key={i} value={val} onChange={(e) => set(e.target.value)}
                placeholder={ph} type={i === 1 ? "number" : "text"}
                style={{
                  padding: "0.4rem 0.6rem",
                  background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
                  borderRadius: "3px", color: "var(--text)", fontSize: "0.82rem", outline: "none",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={!name.trim() || isPending} style={{
              padding: "0.45rem 1rem", background: "#3a6fc9",
              color: "white", border: "none", borderRadius: "2px",
              cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
              opacity: !name.trim() || isPending ? 0.4 : 1,
            }}>
              追加
            </button>
            <button type="button" onClick={() => setShowAdd(false)} style={{
              padding: "0.45rem 0.8rem", background: "transparent",
              border: "1px solid var(--border)", borderRadius: "2px",
              cursor: "pointer", color: "var(--dim)", fontSize: "0.82rem",
            }}>
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          width: "100%", padding: "0.6rem",
          background: "transparent", border: "1px dashed var(--border)",
          color: "var(--dim)", borderRadius: "2px",
          cursor: "pointer", fontSize: "0.82rem", letterSpacing: "0.06em",
          transition: "all 0.2s ease",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3a6fc9"; e.currentTarget.style.color = "#3a6fc9" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--dim)" }}
        >
          ＋ 項目を追加する
        </button>
      )}
    </div>
  )
}

function MetricCard({ metric }: { metric: AttractionMetric & { logs: AttractionLog[] } }) {
  const [value, setValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const latestLog  = metric.logs[metric.logs.length - 1]
  const prevLog    = metric.logs[metric.logs.length - 2]
  const current    = latestLog?.value ?? metric.value ?? null
  const prev       = prevLog?.value ?? null
  const trend      = current !== null && prev !== null ? current - prev : null
  const pct        = metric.target && current !== null
    ? Math.min(100, Math.round((current / metric.target) * 100))
    : null
  const lastRecorded = latestLog ? formatDistanceToNow(new Date(latestLog.createdAt), { addSuffix: true, locale: ja }) : null

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (value === "") return
    startTransition(async () => {
      await recordAttractionValue({ metricId: metric.id, value: Number(value) })
      setValue("")
    })
  }

  const handleDelete = () => {
    startDeleteTransition(() => deleteAttractionMetric(metric.id))
  }

  return (
    <div className="surface rounded-xl p-4 group/metric relative">
      {/* ヘッダー */}
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <span className="text-sm font-medium">{metric.name}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-serif font-light" style={{ color: "#3a6fc9" }}>
            {current !== null ? current : "—"}
          </span>
          {metric.unit && <span className="text-xs text-dim">{metric.unit}</span>}
          {trend !== null && trend !== 0 && (
            <span className="text-xs font-mono" style={{ color: trend > 0 ? "var(--red)" : "var(--green)" }}>
              {trend > 0 ? "↑" : "↓"}{Math.abs(trend).toFixed(trend % 1 === 0 ? 0 : 1)}
            </span>
          )}
        </div>
      </div>
      {lastRecorded && (
        <p className="text-[10px] font-mono -mt-2 mb-3" style={{ color: "var(--faint)" }}>
          最終: {lastRecorded}
        </p>
      )}

      {/* プログレスバー */}
      {pct !== null && (
        <div className="mb-3">
          <div className="flex justify-between mb-1 text-[10px] font-mono text-dim">
            <span>目標: {metric.target}{metric.unit}</span>
            <span style={{ color: "#3a6fc9" }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3a6fc9, rgba(58,111,201,0.6))" }} />
          </div>
        </div>
      )}

      {/* 記録フォーム */}
      <form onSubmit={handleRecord} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
          placeholder="値を入力"
          className="input-base text-sm flex-1"
        />
        <button type="submit" disabled={value === "" || isPending}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
          style={{ background: "rgba(58,111,201,0.15)", border: "1px solid rgba(58,111,201,0.4)", color: "#3a6fc9", minHeight: 36 }}>
          記録
        </button>
      </form>

      {/* 削除ボタン */}
      <div className="absolute top-3 right-3 opacity-0 group-hover/metric:opacity-100 transition-opacity">
        <ConfirmButton onConfirm={handleDelete} disabled={isDeleting} size="xs" className="p-1 rounded" />
      </div>
    </div>
  )
}
