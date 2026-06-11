"use client"

import type { GravityLog } from "@uwiki/database"
import { useState, useTransition } from "react"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { Trash2 } from "lucide-react"
import { createGravityLog, deleteGravityLog } from "@/actions/gravity"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

const WEIGHTS = [
  { val: 1, label: "軽",    emoji: "",   borderW: 2,  bg: "rgba(184,122,58,0.04)", borderColor: "#b87a3a" },
  { val: 3, label: "重",    emoji: "🪨", borderW: 5,  bg: "rgba(184,122,58,0.10)", borderColor: "#d4915c" },
  { val: 5, label: "超重力", emoji: "⚓", borderW: 7,  bg: "rgba(184,122,58,0.18)", borderColor: "#f0a560",
    glow: "inset 0 0 20px rgba(184,122,58,0.15), 0 0 16px rgba(184,122,58,0.18)" },
]

export function GravityInternal({ logs, totalCount }: { logs: GravityLog[]; totalCount?: number }) {
  const [text, setText] = useState("")
  const [weight, setWeight] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [deleting, startDeleteTransition] = useTransition()

  const lightCount  = logs.filter((l) => l.intensity === 1).length
  const heavyCount  = logs.filter((l) => l.intensity === 3).length
  const superCount  = logs.filter((l) => l.intensity === 5).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    startTransition(async () => {
      await createGravityLog({ text: text.trim(), intensity: weight })
      setText("")
      setWeight(1)
    })
  }

  return (
    <div style={{ maxWidth: "min(720px, 100%)", margin: "0 auto" }}>
      {/* セクションヘッダー */}
      <div style={{
        borderLeft: "3px solid #c9a84c",
        padding: "0.8rem 1.2rem",
        marginBottom: "1.8rem",
        background: "rgba(201,168,76,0.04)",
        borderRadius: "0 0.4rem 0.4rem 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "1.3rem" }}>✨</span>
          <h2 style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: "1.2rem", fontWeight: 500,
            color: "#c9a84c", letterSpacing: "0.05em",
          }}>砂のログ</h2>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {(totalCount ?? logs.length) > 0 && (
              <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#c9a84c", background: "rgba(201,168,76,0.12)", padding: "2px 6px", borderRadius: 4 }}>
                {totalCount ?? logs.length}粒
              </span>
            )}
            <span style={{ fontSize: "0.7rem", color: "var(--dim)", letterSpacing: "0.1em" }}>
              メンター（重力AI）
            </span>
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--dim)", lineHeight: 1.6, margin: 0 }}>
          思考の断片を、その場で。タスクではなく、内面の「砂」として堆積させる場所。
        </p>
        {logs.length > 0 && (
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
            {lightCount > 0 && (
              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "var(--dim)" }}>
                軽 {lightCount}
              </span>
            )}
            {heavyCount > 0 && (
              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#d4915c" }}>
                🪨 {heavyCount}
              </span>
            )}
            {superCount > 0 && (
              <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#f0a560" }}>
                ⚓ {superCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1.8rem" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="今、感じていることを「砂の一粒」として（280字以内）"
          rows={3}
          style={{
            width: "100%", minHeight: 72,
            padding: "0.7rem",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            color: "var(--text)",
            fontFamily: "'Noto Serif JP', serif",
            fontSize: "0.92rem",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#c9a84c")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.6rem" }}>
          {/* 熱量ボタン */}
          <div style={{ display: "flex", gap: "0.3rem", flex: 1 }}>
            {WEIGHTS.map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setWeight(val)}
                style={{
                  flex: 1, padding: "0.55rem 0.4rem",
                  minHeight: 40,
                  background: weight === val ? "rgba(201,168,76,0.15)" : "transparent",
                  border: `1px solid ${weight === val ? "#c9a84c" : "var(--border)"}`,
                  color: weight === val ? "#c9a84c" : "var(--dim)",
                  borderRadius: "6px", cursor: "pointer",
                  fontSize: "0.75rem", fontWeight: weight === val ? 600 : 400,
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={{
            fontSize: "0.72rem", fontFamily: "monospace", transition: "color 0.2s",
            color: text.length >= 261 ? "var(--red)" : text.length >= 201 ? "var(--amber)" : "var(--dim)",
          }}>
            {text.length}/280
          </span>
          <button
            type="submit"
            disabled={!text.trim() || isPending}
            style={{
              padding: "0.55rem 1.2rem",
              minHeight: 40,
              background: "#c9a84c",
              color: "#060c1a",
              border: "none", borderRadius: "6px",
              cursor: "pointer", fontWeight: 700,
              fontSize: "0.85rem", letterSpacing: "0.08em",
              opacity: (!text.trim() || isPending) ? 0.35 : 1,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            沈める
          </button>
        </div>
      </form>

      {/* ログ一覧 */}
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.6rem",
        maxHeight: "60vh", overflowY: "auto", paddingRight: "0.4rem",
      }}>
        {logs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--dim)", fontStyle: "italic", fontSize: "0.85rem" }}>
            まだ、砂は降っていない
          </p>
        ) : (() => {
          const grouped: { date: string; items: GravityLog[] }[] = []
          for (const log of logs) {
            const d = log.date ?? format(new Date(log.createdAt), "yyyy-MM-dd")
            const last = grouped[grouped.length - 1]
            if (last && last.date === d) { last.items.push(log) }
            else grouped.push({ date: d, items: [log] })
          }
          const dateLabel = (d: string) => {
            try {
              const parsed = parseISO(d)
              if (isToday(parsed)) return "今日"
              if (isYesterday(parsed)) return "昨日"
              return format(parsed, "M月d日 (E)", { locale: ja })
            } catch { return d }
          }
          return grouped.map(({ date, items }) => (
            <div key={date}>
              <p style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "var(--faint)", letterSpacing: "0.08em", marginBottom: "0.4rem", paddingLeft: "0.2rem" }}>
                {dateLabel(date)} · {items.length}粒
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.8rem" }}>
                {items.map((log) => {
          const validVals = WEIGHTS.map((w) => w.val)
          const w = WEIGHTS.find((w) => w.val === log.intensity) ?? WEIGHTS[validVals.indexOf(Math.min(...validVals.filter(v => v <= (log.intensity ?? 1)))) ?? 0] ?? WEIGHTS[0]
          return (
            <div
              key={log.id}
              style={{
                padding: "0.7rem 2rem 0.7rem 0.9rem",
                background: w.bg,
                borderLeft: `${w.borderW}px solid ${w.borderColor}`,
                borderRadius: "6px",
                fontSize: "0.88rem",
                lineHeight: 1.5,
                position: "relative",
                boxShadow: w.glow,
              }}
            >
              {w.emoji && (
                <span style={{ position: "absolute", right: 8, top: 8, fontSize: "0.85rem", opacity: 0.5 }}>
                  {w.emoji}
                </span>
              )}
              <p style={{ margin: 0, color: "var(--text)", paddingRight: "1.5rem" }}>{log.text}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--dim)" }}>
                <span>{w.label}</span>
                <span style={{ fontFamily: "monospace" }}>
                  {format(new Date(log.createdAt), "HH:mm", { locale: ja })}
                </span>
              </div>
              <div style={{ position: "absolute", top: 4, right: 4 }}>
                <ConfirmButton
                  onConfirm={() => startDeleteTransition(() => deleteGravityLog(log.id))}
                  disabled={deleting}
                  size="xs"
                  className="p-1 rounded"
                />
              </div>
            </div>
          )
        })}
              </div>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
