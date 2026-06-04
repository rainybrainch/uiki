"use client"

import { useState, useTransition } from "react"
import { togglePersona, deletePersona } from "@/app/personas/actions"

export function PersonaList({ personas }: { personas: any[] }) {
  const [isPending, startTransition] = useTransition()

  if (personas.length === 0) {
    return (
      <div style={{
        padding: "40px 20px", textAlign: "center", border: "1px dashed rgba(255,255,255,.1)",
        borderRadius: 12, color: "var(--fg-muted, #888)", marginBottom: 24,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎭</div>
        <div>まだコメント人格がいません</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>上のフォームから追加してください</div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--fg-muted, #888)", marginBottom: 10, paddingBottom: 6,
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}>
        人格一覧
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {personas.map(p => (
          <PersonaCard key={p.id} persona={p} isPending={isPending} startTransition={startTransition} />
        ))}
      </div>
    </div>
  )
}

function PersonaCard({ persona: p, isPending, startTransition }: any) {
  const [delConfirm, setDelConfirm] = useState(false)

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      border: `1px solid rgba(255,255,255,${p.enabled ? ".1" : ".05"})`,
      borderRadius: 10, background: p.enabled ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.1)",
      opacity: p.enabled ? 1 : 0.5, transition: "all .15s",
    }}>
      {/* 色バッジ */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", background: p.color || "#a0b4ff",
        boxShadow: `0 0 8px ${p.color || "#a0b4ff"}`, flexShrink: 0,
      }} />

      {/* 名前・役割 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: 13 }}>{p.name}</span>
          <span style={{
            fontSize: 9, padding: "1px 6px", borderRadius: 999,
            background: "rgba(160,180,255,.12)", color: "#a0b4ff",
            border: "1px solid rgba(160,180,255,.2)", fontWeight: 900,
          }}>
            {p.roleType}
          </span>
          {p.sourceUrl && (
            <span style={{ fontSize: 9, color: "#ff8080" }} title={p.sourceUrl}>▶ AI生成</span>
          )}
        </div>
        {p.catchphrase && (
          <div style={{ fontSize: 11, color: "var(--fg-muted, #888)", marginTop: 1 }}>
            「{p.catchphrase}」
          </div>
        )}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>
          {p.genres?.split(",").filter(Boolean).map((g: string) => (
            <span key={g} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "rgba(87,214,141,.1)", color: "#57d68d", border: "1px solid rgba(87,214,141,.2)" }}>
              {g.trim()}
            </span>
          ))}
          {p.tags?.split(",").filter(Boolean).map((t: string) => (
            <span key={t} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "rgba(255,255,255,.05)", color: "var(--fg-muted, #888)", border: "1px solid rgba(255,255,255,.1)" }}>
              {t.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* 操作 */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => startTransition(() => togglePersona(p.id, !p.enabled))}
          disabled={isPending}
          style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: "pointer",
            border: p.enabled ? "1px solid rgba(87,200,124,.4)" : "1px solid rgba(255,255,255,.15)",
            background: p.enabled ? "rgba(87,200,124,.1)" : "rgba(255,255,255,.04)",
            color: p.enabled ? "#57c87c" : "var(--fg-muted, #888)",
          }}
        >
          {p.enabled ? "有効" : "無効"}
        </button>

        {!delConfirm ? (
          <button onClick={() => setDelConfirm(true)} style={delBtnStyle}>削除</button>
        ) : (
          <>
            <button onClick={() => startTransition(() => deletePersona(p.id))}
              style={{ ...delBtnStyle, color: "#e05555", borderColor: "rgba(224,85,85,.4)" }}>確認</button>
            <button onClick={() => setDelConfirm(false)} style={delBtnStyle}>✕</button>
          </>
        )}
      </div>
    </div>
  )
}

const delBtnStyle: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 900, cursor: "pointer",
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)",
  color: "var(--fg-muted, #888)",
}
