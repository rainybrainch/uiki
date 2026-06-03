"use client"

import { useState, useTransition } from "react"
import { createAttractionMetric, recordAttractionValue } from "@/actions/gravity"

const SELF_METRICS = [
  { key: "mood",    label: "😊 気分",  opts: ["😞 1","😐 2","🙂 3","😄 4","🤩 5"] },
  { key: "fatigue", label: "⚡ 疲労",  opts: ["完全 1","回復 2","普通 3","疲労 4","限界 5"] },
  { key: "hunger",  label: "🍽 空腹",  opts: ["満腹 1","普通 2","小腹 3","空腹 4","激空 5"] },
]

export function GravityExternal({ metrics }: { metrics: any[] }) {
  const [showAdd, setShowAdd]     = useState(false)
  const [name, setName]           = useState("")
  const [target, setTarget]       = useState("")
  const [unit, setUnit]           = useState("")
  const [selfReport, setSelf]     = useState<Record<string, number>>({})
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
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
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
        <div style={{ fontSize: "0.82rem", color: "var(--dim)", marginBottom: "0.8rem" }}>
          今の自己申告（タップで記録）
        </div>
        {SELF_METRICS.map(({ key, label, opts }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--dim)", minWidth: 60 }}>{label}</span>
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {opts.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setSelf((prev) => ({ ...prev, [key]: i + 1 }))}
                  style={{
                    padding: "0.2rem 0.55rem",
                    fontSize: "0.72rem", borderRadius: "999px",
                    cursor: "pointer", transition: "all 0.2s ease",
                    background: selfReport[key] === i + 1 ? "rgba(58,111,201,0.2)" : "transparent",
                    border: `1px solid ${selfReport[key] === i + 1 ? "#3a6fc9" : "var(--border)"}`,
                    color: selfReport[key] === i + 1 ? "#3a6fc9" : "var(--dim)",
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

function MetricCard({ metric }: { metric: any }) {
  const [value, setValue]         = useState("")
  const [isPending, startTransition] = useTransition()
  const latestLog = metric.logs[metric.logs.length - 1]
  const current   = latestLog?.value ?? metric.value ?? null
  const pct       = metric.target && current !== null
    ? Math.min(100, Math.round((current / metric.target) * 100))
    : null

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    startTransition(async () => {
      await recordAttractionValue({ metricId: metric.id, value: Number(value) })
      setValue("")
    })
  }

  return (
    <div style={{
      padding: "1rem 1.2rem",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid var(--border)", borderRadius: "0.4rem",
    }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 500, color: "var(--text)" }}>{metric.name}</span>
        <span style={{ color: "#3a6fc9", fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 600 }}>
          {current !== null ? current : "—"}
          {metric.unit && <span style={{ fontSize: "0.75rem", color: "var(--dim)", marginLeft: "0.2rem" }}>{metric.unit}</span>}
        </span>
      </div>

      {/* プログレスバー */}
      {pct !== null && (
        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.7rem", color: "var(--dim)" }}>
            <span>目標: {metric.target}{metric.unit}</span>
            <span style={{ color: "#3a6fc9", fontFamily: "monospace" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: "linear-gradient(90deg, #3a6fc9, rgba(58,111,201,0.6))",
              width: `${pct}%`,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
        </div>
      )}

      {/* 記録フォーム */}
      <form onSubmit={handleRecord} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number" placeholder="値を記録する"
          style={{
            flex: 1, padding: "0.4rem 0.6rem",
            background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
            borderRadius: "2px", color: "var(--text)", fontSize: "0.82rem", outline: "none",
          }}
        />
        <button type="submit" disabled={!value || isPending} style={{
          padding: "0.4rem 0.9rem",
          background: "rgba(58,111,201,0.15)",
          border: "1px solid rgba(58,111,201,0.4)",
          color: "#3a6fc9", borderRadius: "2px",
          cursor: "pointer", fontSize: "0.82rem",
          opacity: !value || isPending ? 0.4 : 1,
          transition: "opacity 0.2s",
        }}>
          記録
        </button>
      </form>
    </div>
  )
}
