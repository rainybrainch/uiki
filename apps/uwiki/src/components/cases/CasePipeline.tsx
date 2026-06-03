"use client"

import { useState, useTransition } from "react"
import { updateCaseStatus, updateCasePaid, deleteCase } from "@/actions/cases"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronRight, Check, Trash2 } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  ACQUIRED:    "#c9a84c",
  DEVELOPING:  "#3a6fc9",
  DELIVERED:   "#8b5cf6",
  WAITING_PAY: "#f59e0b",
  DONE:        "#4ade80",
}

const NEXT_STATUS: Record<string, string | null> = {
  ACQUIRED:    "DEVELOPING",
  DEVELOPING:  "DELIVERED",
  DELIVERED:   "WAITING_PAY",
  WAITING_PAY: "DONE",
  DONE:        null,
}

const NEXT_LABELS: Record<string, string> = {
  ACQUIRED:    "開発開始 →",
  DEVELOPING:  "納品する →",
  DELIVERED:   "支払い待ちへ →",
  WAITING_PAY: "入金確認 →",
  DONE:        "",
}

export function CasePipeline({ columns }: {
  columns: { status: string; label: string; cases: any[] }[]
}) {
  return (
    <div className="space-y-6">
      {columns.filter((col) => col.cases.length > 0 || col.status === "ACQUIRED").map((col) => (
        <div key={col.status}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[col.status] }} />
            <h3 className="text-sm font-medium" style={{ color: STATUS_COLORS[col.status] }}>
              {col.label}
            </h3>
            <span className="text-xs font-mono text-faint">{col.cases.length}件</span>
          </div>
          {col.cases.length === 0 ? (
            <p className="text-xs text-faint px-3 py-2">なし</p>
          ) : (
            <div className="space-y-2">
              {col.cases.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CaseCard({ c }: { c: any }) {
  const [showPay, setShowPay] = useState(false)
  const [payAmount, setPayAmount] = useState(String(c.reward))
  const [isPending, startTransition] = useTransition()

  const next = NEXT_STATUS[c.status]
  const color = STATUS_COLORS[c.status]

  const handleNext = () => {
    if (!next) return
    if (next === "DONE") { setShowPay(true); return }
    startTransition(() => updateCaseStatus(c.id, next))
  }

  const handlePaid = () => {
    startTransition(async () => {
      await updateCasePaid(c.id, Number(payAmount))
      setShowPay(false)
    })
  }

  const handleDelete = () => {
    if (!confirm(`「${c.name}」を削除しますか？`)) return
    startTransition(() => deleteCase(c.id))
  }

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}33`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{c.name}</p>
          {c.client && <p className="text-xs text-dim">{c.client}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-mono font-medium" style={{ color }}>
            ¥{c.reward.toLocaleString()}
          </p>
          {c.status === "DONE" && c.paidAmount !== c.reward && (
            <p className="text-xs text-dim">実 ¥{c.paidAmount.toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-dim mb-3">
        {c.category && <span className="px-1.5 py-0.5 rounded" style={{ background: "var(--faint)" }}>{c.category}</span>}
        {c.dueDate && (
          <span>{format(new Date(c.dueDate), "M月d日", { locale: ja })} 期限</span>
        )}
      </div>

      {c.memo && <p className="text-xs text-dim mb-3 line-clamp-2">{c.memo}</p>}

      {showPay ? (
        <div className="flex items-center gap-2">
          <input
            value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
            type="number" className="input-base flex-1 text-xs"
            placeholder="実際の受取額（円）"
          />
          <button onClick={handlePaid} disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044" }}
          >
            <Check size={12} />
          </button>
          <button onClick={() => setShowPay(false)} className="text-xs text-dim">×</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {next && (
            <button
              onClick={handleNext} disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}
            >
              {NEXT_LABELS[c.status]} <ChevronRight size={11} />
            </button>
          )}
          {c.status === "DONE" && (
            <span className="text-xs font-medium" style={{ color: "#4ade80" }}>✓ 完了</span>
          )}
          <button
            onClick={handleDelete} disabled={isPending}
            className="ml-auto p-1.5 rounded-lg text-faint hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
