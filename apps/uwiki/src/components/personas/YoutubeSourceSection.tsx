"use client"

import { useState, useTransition } from "react"
import { addYoutubeSource, deleteYoutubeSource, generatePersonasFromSource } from "@/app/personas/actions"

const STREAM_GENRE_OPTIONS = [
  "ゲーム","実況","エンタメ","音楽","歌","配信","学習","経済","投資","政治",
  "漫画","映画","本","ラジオ","RAINYBRAIN",
]

export function YoutubeSourceSection({ sources }: { sources: any[] }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [genStatus, setGenStatus] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function toggleGenre(g: string) {
    setSelected(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("streamGenres", selected.join(","))
    startTransition(async () => {
      await addYoutubeSource(fd)
      ;(e.target as HTMLFormElement).reset()
      setSelected([])
      setOpen(false)
    })
  }

  async function handleGenerate(sourceId: string) {
    setGenStatus(prev => ({ ...prev, [sourceId]: "生成中…" }))
    startTransition(async () => {
      const res = await generatePersonasFromSource(sourceId)
      if (res?.error) {
        setGenStatus(prev => ({ ...prev, [sourceId]: "❌ " + res.error }))
      } else {
        setGenStatus(prev => ({ ...prev, [sourceId]: `✓ ${res.created}人生成` }))
        setTimeout(() => setGenStatus(prev => { const n = {...prev}; delete n[sourceId]; return n }), 3000)
      }
    })
  }

  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--fg-muted, #888)", marginBottom: 10, paddingBottom: 6,
        borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 8,
      }}>
        YouTube ソース
        <span style={{ fontSize: 10, fontWeight: 400, color: "var(--fg-muted, #888)", textTransform: "none", letterSpacing: 0 }}>
          — URLをストックして定期的に AI 人格を生成
        </span>
      </div>

      {/* ソース一覧 */}
      {sources.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {sources.map(s => (
            <div key={s.id} style={{
              display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10,
              border: "1px solid rgba(255,80,80,.15)", background: "rgba(255,80,80,.03)",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 14 }}>▶</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={s.url} target="_blank" rel="noopener"
                  style={{ fontSize: 12, color: "#ff8080", textDecoration: "none", display: "block",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.url}
                </a>
                {s.description && (
                  <div style={{ fontSize: 11, color: "var(--fg-muted, #888)", marginTop: 2 }}>{s.description}</div>
                )}
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  {s.streamGenres?.split(",").filter(Boolean).map((g: string) => (
                    <span key={g} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999,
                      background: "rgba(87,214,141,.1)", color: "#57d68d", border: "1px solid rgba(87,214,141,.2)" }}>
                      {g.trim()}
                    </span>
                  ))}
                  {s.lastGenerated && (
                    <span style={{ fontSize: 9, color: "var(--fg-muted, #888)" }}>
                      最終生成: {new Date(s.lastGenerated).toLocaleDateString("ja-JP")} ({s.personaCount}人)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <button
                  onClick={() => handleGenerate(s.id)}
                  disabled={isPending}
                  style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 900,
                    border: "1px solid rgba(100,210,255,.3)", background: "rgba(100,210,255,.08)",
                    color: "#64d2ff", cursor: isPending ? "wait" : "pointer",
                  }}
                >
                  {genStatus[s.id] || "✨ 生成"}
                </button>
                <button
                  onClick={() => startTransition(() => deleteYoutubeSource(s.id))}
                  style={{ padding: "5px 8px", borderRadius: 7, fontSize: 10, border: "1px solid rgba(255,255,255,.1)", background: "0", color: "var(--fg-muted, #888)", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* URL追加フォーム */}
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,80,80,.25)",
          background: "rgba(255,80,80,.05)", color: "#ff8080", fontSize: 12, fontWeight: 900,
          cursor: "pointer",
        }}>
          ＋ YouTube URL を追加
        </button>
      ) : (
        <form onSubmit={handleAdd} style={{
          border: "1px solid rgba(255,80,80,.2)", borderRadius: 10,
          background: "rgba(255,80,80,.03)", padding: 16, display: "grid", gap: 10,
        }}>
          <div>
            <label style={lbl}>YouTube URL</label>
            <input name="url" required type="url" placeholder="https://youtube.com/@channel or /watch?v=..."
              style={inp} />
          </div>
          <div>
            <label style={lbl}>説明（任意）</label>
            <input name="description" placeholder="このチャンネルの視聴者像・特徴" style={inp} />
          </div>
          <div>
            <label style={lbl}>対象ジャンル（クリックで選択）</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {STREAM_GENRE_OPTIONS.map(g => (
                <button key={g} type="button" onClick={() => toggleGenre(g)} style={{
                  padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 900,
                  cursor: "pointer", transition: "all .12s",
                  border: selected.includes(g) ? "1px solid rgba(87,214,141,.5)" : "1px solid rgba(255,255,255,.12)",
                  background: selected.includes(g) ? "rgba(87,214,141,.12)" : "rgba(255,255,255,.04)",
                  color: selected.includes(g) ? "#57d68d" : "var(--fg-muted, #888)",
                }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={isPending} style={{
              padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,80,80,.4)",
              background: "rgba(255,80,80,.1)", color: "#ff8080", fontWeight: 900,
              fontSize: 12, cursor: "pointer",
            }}>
              追加する
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)",
              background: "0", color: "var(--fg-muted, #888)", fontSize: 12, cursor: "pointer",
            }}>
              キャンセル
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--fg-muted, #888)", marginBottom: 4,
}
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.2)",
  fontSize: 13, outline: "none", boxSizing: "border-box",
}
