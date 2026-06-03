"use client"

import { useState, useTransition } from "react"
import { createAdjustment } from "@/actions/adjustments"
import { CheckCircle2, XCircle, Circle, Plus } from "lucide-react"

export function WeeklyCheck({ dreams, adjustments }: { dreams: any[]; adjustments: any[] }) {
  const [open, setOpen] = useState(false)
  const [vow, setVow]     = useState<boolean | null>(null)
  const [cons, setCons]   = useState<boolean | null>(null)
  const [vis, setVis]     = useState<boolean | null>(null)
  const [what, setWhat]   = useState("")
  const [why, setWhy]     = useState("")
  const [dream, setDream] = useState("")
  const [isPending, startTransition] = useTransition()

  const weekChecks = adjustments.filter((a) => a.type === "WEEKLY").slice(0, 3)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!what.trim()) return
    startTransition(async () => {
      await createAdjustment({
        type: "WEEKLY",
        what: what.trim(),
        why: why || undefined,
        vowCheck: vow ?? undefined,
        constCheck: cons ?? undefined,
        visionCheck: vis ?? undefined,
        relatedDream: dream || undefined,
      })
      setWhat(""); setWhy(""); setVow(null); setCons(null); setVis(null); setDream(""); setOpen(false)
    })
  }

  return (
    <div className="surface rounded-xl p-5 animate-fade-in delay-100">
      <div className="flex items-center justify-between mb-4">
        <p className="section-label mb-0">週次 Check — 誓約 × 実行</p>
        <button onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.25)" }}>
          <Plus size={11} /> 記録
        </button>
      </div>

      {/* 3軸チェック（視覚） */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "誓約は守れたか", key: "vowCheck" },
          { label: "制約の中で実行", key: "constCheck" },
          { label: "目的に向かった", key: "visionCheck" },
        ].map(({ label, key }) => {
          const latest = weekChecks.find((a) => a[key] !== null && a[key] !== undefined)
          const val = latest?.[key]
          return (
            <div key={key} className="rounded-lg p-3 text-center"
              style={{ background: val === true ? "rgba(74,222,128,0.08)" : val === false ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
              <div className="flex justify-center mb-1">
                {val === true
                  ? <CheckCircle2 size={18} style={{ color: "var(--green)" }} />
                  : val === false
                  ? <XCircle size={18} style={{ color: "var(--red)" }} />
                  : <Circle size={18} style={{ color: "var(--faint)" }} />
                }
              </div>
              <p className="text-[10px] leading-tight" style={{ color: val === true ? "var(--green)" : val === false ? "var(--red)" : "var(--dim)" }}>{label}</p>
            </div>
          )
        })}
      </div>

      {/* 入力フォーム */}
      {open && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-xl"
          style={{ background: "rgba(58,111,201,0.04)", border: "1px solid rgba(58,111,201,0.15)" }}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "誓約を守った？", state: vow, set: setVow },
              { label: "制約の中で？", state: cons, set: setCons },
              { label: "目的に向かった？", state: vis, set: setVis },
            ].map(({ label, state, set }) => (
              <div key={label}>
                <p className="text-[10px] text-dim mb-1">{label}</p>
                <div className="flex gap-1">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => set(v === state ? null : v)}
                      className="flex-1 py-1.5 rounded text-xs transition-all"
                      style={{
                        background: state === v ? (v ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)") : "var(--faint)",
                        border: `1px solid ${state === v ? (v ? "var(--green)" : "var(--red)") : "transparent"}`,
                        color: state === v ? (v ? "var(--green)" : "var(--red)") : "var(--dim)",
                      }}>
                      {v ? "✓" : "✗"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <textarea value={what} onChange={(e) => setWhat(e.target.value)}
            placeholder="今週の気づき・変えること *" rows={2}
            className="input-base text-xs resize-none mb-2" required />
          <textarea value={why} onChange={(e) => setWhy(e.target.value)}
            placeholder="なぜそう判断した？（任意）" rows={1}
            className="input-base text-xs resize-none mb-2" />

          {dreams.length > 0 && (
            <select value={dream} onChange={(e) => setDream(e.target.value)} className="input-base text-xs mb-3">
              <option value="">関連する世界（任意）</option>
              {dreams.map((d) => <option key={d.id} value={d.title}>{d.title}</option>)}
            </select>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={!what.trim() || isPending}
              className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{ background: "var(--accent)", color: "white" }}>
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

      {/* 直近のWeekly Check */}
      {weekChecks.length > 0 && (
        <div className="space-y-2">
          {weekChecks.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-2"
              style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex gap-1 shrink-0 mt-0.5">
                {[a.vowCheck, a.constCheck, a.visionCheck].map((v, i) => (
                  <div key={i} className="w-3 h-3 rounded-full"
                    style={{ background: v === true ? "var(--green)" : v === false ? "var(--red)" : "var(--faint)" }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug">{a.what}</p>
                {a.relatedDream && <p className="text-[10px] text-faint mt-0.5">{a.relatedDream}</p>}
              </div>
              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--dim)" }}>
                {new Date(a.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
