"use client"

import { useState, useTransition } from "react"
import { createDream } from "@/actions/dreams"
import { Plus, ChevronDown, ChevronUp } from "lucide-react"

const CATEGORIES = [
  { value: "OATH",     label: "十二の誓い" },
  { value: "CREATIVE", label: "創作（個人）" },
  { value: "BODY",     label: "身体・修行" },
  { value: "HABIT",    label: "習慣・継続" },
  { value: "PROJECT",  label: "プロジェクト（RB）" },
  { value: "BUSINESS", label: "事業・収益" },
  { value: "OTHER",    label: "その他" },
]

const FIELDS = [
  { key: "definition",  label: "② 定義",          placeholder: "この世界とは何か",           rows: 2 },
  { key: "vision",      label: "③ 目的/ビジョン",  placeholder: "なぜ創るか、最終形",         rows: 3 },
  { key: "vow",         label: "④ 誓約",           placeholder: "目的を実現するための約束",   rows: 2 },
  { key: "constraints", label: "⑤ 制約",           placeholder: "誓約を実現するための枠",     rows: 2 },
  { key: "period",      label: "⑥ 期間",           placeholder: "例: 2026年中 / 生涯",       rows: 1 },
  { key: "kpi",         label: "⑦ 評価軸/KPI",     placeholder: "成功の測り方",               rows: 2 },
  { key: "connections", label: "⑧ 相互関連性",     placeholder: "他の世界との繋がり（例: ぽもじかん, 電脳世界）", rows: 2 },
] as const

type FieldKey = typeof FIELDS[number]["key"]

export function DreamForm({ catLabels, usedLayers = [] }: { catLabels: Record<string, string>; usedLayers?: number[] }) {
  const nextLayer = (() => {
    const used = new Set(usedLayers)
    for (let i = 1; i <= 100; i++) { if (!used.has(i)) return i }
    return null
  })()

  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("OATH")
  const [layer, setLayer] = useState(nextLayer ? String(nextLayer) : "")
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    definition: "", vision: "", vow: "", constraints: "", period: "", kpi: "", connections: "",
  })
  const [isPending, startTransition] = useTransition()
  const [justAdded, setJustAdded] = useState("")

  const setField = (key: FieldKey, val: string) =>
    setFields((prev) => ({ ...prev, [key]: val }))

  const reset = () => {
    setTitle(""); setCategory("OATH"); setLayer("")
    setFields({ definition: "", vision: "", vow: "", constraints: "", period: "", kpi: "", connections: "" })
    setOpen(false); setShowAll(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const t = title.trim()
    startTransition(async () => {
      await createDream({
        title: t,
        category,
        layer: layer ? Number(layer) : undefined,
        ...fields,
      })
      setJustAdded(t)
      reset()
      setTimeout(() => setJustAdded(""), 2500)
    })
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {justAdded && (
          <div className="rounded-xl px-4 py-3 text-sm animate-pop-in"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
            ✓ 「{justAdded}」を百層世界に刻みました
          </div>
        )}
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px dashed rgba(139,92,246,0.3)", color: "#8b5cf6" }}
        >
          <Plus size={15} /> 新しい世界を掘る
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-5"
      style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.25)" }}
    >
      {/* ① 世界名 */}
      <div className="mb-4">
        <label className="text-xs text-dim block mb-1">① 世界名 *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="例: ぽもじかん" required className="input-base text-sm font-medium" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-dim block mb-1">カテゴリ</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">
            No.（1〜100）
            {nextLayer && layer === String(nextLayer) && (
              <span className="ml-1.5 text-[10px]" style={{ color: "var(--accent)" }}>← 次の空き</span>
            )}
          </label>
          <input value={layer} onChange={(e) => setLayer(e.target.value)}
            type="number" min="1" max="100"
            placeholder={nextLayer ? `次の空き: ${nextLayer}` : "自動"}
            className="input-base" />
          {layer && usedLayers.includes(Number(layer)) && (
            <p className="text-[10px] mt-1" style={{ color: "var(--red)" }}>⚠ No.{layer} は既に使用中</p>
          )}
        </div>
      </div>

      {/* 詳細フィールドトグル */}
      <button type="button" onClick={() => setShowAll((v) => !v)}
        className="flex items-center gap-1 text-xs mb-4 transition-colors"
        style={{ color: showAll ? "#8b5cf6" : "var(--dim)", background: "none", border: "none", cursor: "pointer" }}
      >
        {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showAll ? "詳細を閉じる" : "定義・ビジョン・誓約・KPIを入力"}
      </button>

      {showAll && (
        <div className="space-y-4 mb-4">
          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className="text-xs text-dim block mb-1">{label}</label>
              {rows === 1 ? (
                <input value={fields[key]} onChange={(e) => setField(key, e.target.value)}
                  placeholder={placeholder} className="input-base text-sm" />
              ) : (
                <textarea value={fields[key]} onChange={(e) => setField(key, e.target.value)}
                  placeholder={placeholder} rows={rows}
                  className="input-base text-sm resize-none" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={!title.trim() || isPending}
          className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: "#8b5cf6", color: "white" }}
        >
          掘る
        </button>
        <button type="button" onClick={reset}
          className="px-4 py-2 rounded-lg text-sm text-dim"
          style={{ border: "1px solid var(--border)", background: "none", cursor: "pointer" }}
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
