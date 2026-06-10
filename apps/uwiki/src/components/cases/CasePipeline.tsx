"use client"

import { useState, useTransition } from "react"
import { updateCaseStatus, updateCasePaid, deleteCase, updateCase } from "@/actions/cases"
import type { Case, CaseStatus } from "@uwiki/database"
import { format, differenceInCalendarDays, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronRight, Check, Trash2, Clock, Pencil, X } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

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
  columns: { status: string; label: string; cases: Case[] }[]
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
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-faint">案件を追加してください</p>
            </div>
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

const MEMO_LIMIT = 80

function CaseCard({ c }: { c: Case }) {
  const [showPay, setShowPay] = useState(false)
  const [payAmount, setPayAmount] = useState(String(c.reward))
  const [memoExpanded, setMemoExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(c.name)
  const [editClient, setEditClient] = useState(c.client ?? "")
  const [editReward, setEditReward] = useState(String(c.reward))
  const [editDueDate, setEditDueDate] = useState(
    c.dueDate ? format(new Date(c.dueDate), "yyyy-MM-dd") : ""
  )
  const [editMemo, setEditMemo] = useState(c.memo ?? "")
  const [isPending, startTransition] = useTransition()
  const memoLong = c.memo && c.memo.length > MEMO_LIMIT

  const saveEdit = () => {
    if (!editName.trim()) return
    startTransition(async () => {
      await updateCase(c.id, {
        name: editName.trim(),
        client: editClient || null,
        reward: Number(editReward) || c.reward,
        dueDate: editDueDate || null,
        memo: editMemo || null,
      })
      setEditing(false)
    })
  }

  const next = NEXT_STATUS[c.status]
  const color = STATUS_COLORS[c.status]

  const handleNext = () => {
    if (!next) return
    if (next === "DONE") { setShowPay(true); return }
    startTransition(() => updateCaseStatus(c.id, next as CaseStatus))
  }

  const handlePaid = () => {
    startTransition(async () => {
      await updateCasePaid(c.id, Number(payAmount))
      setShowPay(false)
    })
  }

  const handleDelete = () => {
    startTransition(() => deleteCase(c.id))
  }

  return (
    <div
      className="rounded-xl p-4 transition-all group/card"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}33`,
        transition: "box-shadow 0.25s, border-color 0.25s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${color}18`
        ;(e.currentTarget as HTMLElement).style.borderColor = `${color}55`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = ""
        ;(e.currentTarget as HTMLElement).style.borderColor = `${color}33`
      }}
    >
      {editing ? (
        <div className="mb-3 space-y-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false) }}
            placeholder="案件名"
            className="input-base text-sm w-full"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={editClient}
              onChange={(e) => setEditClient(e.target.value)}
              placeholder="クライアント"
              className="input-base text-xs"
            />
            <input
              value={editReward}
              onChange={(e) => setEditReward(e.target.value)}
              type="number"
              placeholder="報酬（円）"
              className="input-base text-xs font-mono"
            />
          </div>
          <input
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            type="date"
            className="input-base text-xs w-full"
          />
          <textarea
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
            placeholder="メモ（任意）"
            rows={2}
            className="input-base text-xs w-full resize-none"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={isPending || !editName.trim()}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
              style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
              <Check size={11} /> 保存
            </button>
            <button onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-dim"
              style={{ border: "1px solid var(--border)" }}>
              <X size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 mb-2 group/header">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <button
                onClick={() => setEditing(true)}
                aria-label="案件を編集"
                className="p-0.5 rounded opacity-0 group-hover/header:opacity-100 transition-opacity text-faint hover:text-white shrink-0"
              >
                <Pencil size={10} />
              </button>
            </div>
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
      )}

      <div className="flex items-center gap-2 text-xs text-dim mb-3 flex-wrap">
        {c.category && <span className="px-1.5 py-0.5 rounded shrink-0" style={{ background: "var(--faint)" }}>{c.category}</span>}
        {c.dueDate && (() => {
          const days = differenceInCalendarDays(startOfDay(new Date(c.dueDate)), startOfDay(new Date()))
          const color = days < 0 ? "var(--red)" : days <= 3 ? "#f59e0b" : "var(--dim)"
          const label = days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "今日期限" : days === 1 ? "明日期限" : `${days}日後`
          return (
            <span className="flex items-center gap-1 shrink-0" style={{ color }}>
              <Clock size={10} />
              {label}
            </span>
          )
        })()}
      </div>

      {c.memo && (
        <div className="mb-3">
          <p className="text-xs text-dim leading-relaxed whitespace-pre-wrap">
            {memoExpanded || !memoLong
              ? c.memo
              : c.memo.slice(0, MEMO_LIMIT) + "…"}
          </p>
          {memoLong && (
            <button
              onClick={() => setMemoExpanded((v) => !v)}
              className="text-[10px] mt-0.5 transition-colors hover:opacity-80"
              style={{ color: "var(--dim)" }}
            >
              {memoExpanded ? "折りたたむ ↑" : "もっと見る ↓"}
            </button>
          )}
        </div>
      )}

      {showPay ? (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
          <p className="text-[10px] font-mono tracking-wider" style={{ color: "#4ade80" }}>入金確認 — 実際の受取額を入力</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dim shrink-0">¥</span>
            <input
              value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              type="number" className="input-base flex-1 text-sm font-mono"
              placeholder={c.reward.toLocaleString()}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handlePaid(); if (e.key === "Escape") setShowPay(false) }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handlePaid} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044" }}
            >
              <Check size={12} /> 完了にする
            </button>
            <button onClick={() => setShowPay(false)} className="px-3 py-2 text-xs rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--dim)" }}>
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {next && (
            <button
              onClick={handleNext} disabled={isPending}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: `${color}15`, color, border: `1px solid ${color}33`, minHeight: 36 }}
            >
              {NEXT_LABELS[c.status]} <ChevronRight size={11} />
            </button>
          )}
          {c.status === "DONE" && (
            <span className="text-xs font-medium" style={{ color: "#4ade80" }}>✓ 完了</span>
          )}
          <ConfirmButton onConfirm={handleDelete} disabled={isPending} className="ml-auto p-1.5 rounded-lg" />
        </div>
      )}
    </div>
  )
}
