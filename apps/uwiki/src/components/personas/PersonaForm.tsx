"use client"

import { useState, useTransition } from "react"
import { createPersona } from "@/app/personas/actions"

const ROLE_TYPES = ["共感勢","知識勢","質問勢","懐疑勢","応援勢","初心者勢","ネタ勢","妄想勢","開発者勢","投資家勢"]
const PRESET_COLORS = ["#a0b4ff","#57d68d","#f2c14e","#ff7eb3","#4fc3f7","#c890d8","#ff9f7f","#e879a0","#ffd700","#64d2ff"]

export function PersonaForm() {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState("#a0b4ff")
  const [status, setStatus] = useState("")
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setStatus("")
    startTransition(async () => {
      const res = await createPersona(fd)
      if (res?.error) {
        setStatus("❌ " + res.error)
      } else {
        setStatus("✓ 保存しました")
        ;(e.target as HTMLFormElement).reset()
        setColor("#a0b4ff")
        setTimeout(() => { setOpen(false); setStatus("") }, 800)
      }
    })
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(160,180,255,.4)",
            background: "rgba(160,180,255,.1)", color: "#a0b4ff", fontWeight: 900,
            fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ＋ 人格を追加
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{
          border: "1px solid rgba(160,180,255,.2)", borderRadius: 12,
          background: "rgba(160,180,255,.04)", padding: 20, display: "grid", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontWeight: 900, fontSize: 14, margin: 0 }}>🎭 新しいコメント人格</h3>
            <button type="button" onClick={() => setOpen(false)}
              style={{ marginLeft: "auto", background: 0, border: 0, cursor: "pointer", color: "var(--fg-muted, #888)", fontSize: 16 }}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>名前（必須）</label>
              <input name="name" required placeholder="例: 徹夜ラジオさん"
                style={inputStyle} maxLength={12} />
            </div>
            <div>
              <label style={labelStyle}>ロールタイプ（必須）</label>
              <select name="roleType" style={inputStyle}>
                {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>口癖（推奨）</label>
            <input name="catchphrase" placeholder="例: この感じ好きだなあ"
              style={inputStyle} maxLength={30} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>関連ワード（カンマ区切り）</label>
              <input name="words" placeholder="例: ゲーム,実況,攻略" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ジャンル（配信マッチング用）</label>
              <input name="genres" placeholder="例: ゲーム,エンタメ,配信" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={labelStyle}>タグ（カンマ区切り）</label>
              <input name="tags" placeholder="例: 陽気,ゲーム好き" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>カラー</label>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 24, height: 24, borderRadius: "50%", background: c, border: "none",
                      cursor: "pointer", outline: color === c ? `2px solid ${c}` : "none",
                      outlineOffset: 2
                    }} />
                ))}
              </div>
              <input type="hidden" name="color" value={color} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="submit" disabled={isPending} style={{
              padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(160,180,255,.5)",
              background: "rgba(160,180,255,.18)", color: "#a0b4ff", fontWeight: 900,
              fontSize: 13, cursor: isPending ? "wait" : "pointer",
            }}>
              {isPending ? "保存中…" : "保存する"}
            </button>
            {status && <span style={{ fontSize: 12, color: status.startsWith("✓") ? "#57d68d" : "#e05555" }}>{status}</span>}
          </div>
        </form>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--fg-muted, #888)", marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.2)",
  fontSize: 13, outline: "none", boxSizing: "border-box",
}
