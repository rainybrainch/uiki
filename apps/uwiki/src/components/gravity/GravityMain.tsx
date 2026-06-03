"use client"

import { format, parseISO } from "date-fns"

type Tab = "main" | "internal" | "external"

export function GravityMain({ graphData, onNav, gravityLogs, metrics }: {
  graphData: { date: string; gravityScore: number; attractionScore: number }[]
  onNav: (tab: Tab) => void
  gravityLogs: any[]
  metrics: any[]
}) {
  const maxG = Math.max(...graphData.map((d) => d.gravityScore), 1)
  const W = 600; const H = 180; const PAD = 20

  const toPoint = (i: number, val: number, max: number) => {
    const x = PAD + (i / (graphData.length - 1)) * (W - PAD * 2)
    const y = (H - PAD) - (val / max) * (H - PAD * 2)
    return `${x},${y}`
  }

  const gPoints = graphData.map((d, i) => toPoint(i, d.gravityScore, maxG)).join(" ")
  const aPoints = graphData.map((d, i) => toPoint(i, d.attractionScore, 1)).join(" ")

  // グラデーション用ポリゴン（グラフの下を塗る）
  const gFirst = toPoint(0, graphData[0]?.gravityScore ?? 0, maxG)
  const gLast  = toPoint(graphData.length - 1, graphData[graphData.length - 1]?.gravityScore ?? 0, maxG)
  const aFirst = toPoint(0, graphData[0]?.attractionScore ?? 0, 1)
  const aLast  = toPoint(graphData.length - 1, graphData[graphData.length - 1]?.attractionScore ?? 0, 1)

  const todayGravity = gravityLogs.filter((l) => l.date === format(new Date(), "yyyy-MM-dd")).length
  const todayAttraction = metrics.filter((m) => m.logs.some((l: any) => l.date === format(new Date(), "yyyy-MM-dd"))).length

  return (
    <div style={{ maxWidth: "min(720px, 100%)", margin: "0 auto" }}>

      {/* 2大カード */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.2rem", marginBottom: "2.5rem",
      }}>
        {/* 重力雨域カード */}
        <BigCard
          color="#c9a84c"
          colorDim="rgba(201,168,76,0.5)"
          colorBg="rgba(201,168,76,0.08)"
          icon="🏜"
          title="重力雨域"
          sub="Internal ── 内向き"
          desc="砂のログ・熱量・思想の堆積"
          stat={`今日 ${todayGravity} 粒 / 累計 ${gravityLogs.length} 粒`}
          onClick={() => onNav("internal")}
        />
        {/* 引力雨域カード */}
        <BigCard
          color="#3a6fc9"
          colorDim="rgba(58,111,201,0.5)"
          colorBg="rgba(58,111,201,0.08)"
          icon="💧"
          title="引力雨域"
          sub="External ── 外向き"
          desc="数値・指標・客観的記録"
          stat={`${metrics.length} 項目 / 今日 ${todayAttraction} 件記録`}
          onClick={() => onNav("external")}
        />
      </div>

      {/* 成長グラフ */}
      <div style={{
        marginBottom: "2.5rem",
        padding: "1.4rem",
        background: "rgba(0,0,0,0.25)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
      }}>
        <h3 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "1rem", fontWeight: 500,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.85)",
          marginBottom: "1rem",
        }}>
          成長の可視化 ── 重力と引力の均衡
        </h3>
        {graphData.every((d) => d.gravityScore === 0 && d.attractionScore === 0) ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--dim)", fontSize: "0.85rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem", opacity: 0.3 }}>🌧</div>
            <p>まだデータがありません</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.3rem", color: "var(--faint)" }}>砂のログを記録するとグラフが描かれます</p>
          </div>
        ) : (<>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 180 }} aria-label="成長グラフ">
          <defs>
            <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a6fc9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3a6fc9" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* グリッドライン */}
          {[0.25, 0.5, 0.75].map((r) => (
            <line key={r}
              x1={PAD} y1={(H - PAD) - r * (H - PAD * 2)}
              x2={W - PAD} y2={(H - PAD) - r * (H - PAD * 2)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
          ))}
          {/* 重力エリア */}
          <polygon
            points={`${gFirst} ${gPoints} ${gLast} ${PAD + (W - PAD * 2)},${H - PAD} ${PAD},${H - PAD}`}
            fill="url(#gg)"
          />
          {/* 引力エリア */}
          <polygon
            points={`${aFirst} ${aPoints} ${aLast} ${PAD + (W - PAD * 2)},${H - PAD} ${PAD},${H - PAD}`}
            fill="url(#ag)"
          />
          {/* 折れ線 */}
          <polyline points={gPoints} fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={aPoints} fill="none" stroke="#3a6fc9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* データ点 */}
          {graphData.map((d, i) => (
            <g key={d.date}>
              {d.gravityScore > 0 && (
                <circle cx={PAD + (i / (graphData.length - 1)) * (W - PAD * 2)}
                  cy={(H - PAD) - (d.gravityScore / maxG) * (H - PAD * 2)}
                  r="3" fill="#c9a84c" />
              )}
              {d.attractionScore > 0 && (
                <circle cx={PAD + (i / (graphData.length - 1)) * (W - PAD * 2)}
                  cy={(H - PAD) - d.attractionScore * (H - PAD * 2)}
                  r="3" fill="#3a6fc9" />
              )}
            </g>
          ))}
          {/* 日付ラベル（最初・中・最後） */}
          {[0, Math.floor(graphData.length / 2), graphData.length - 1].map((i) => (
            <text key={i}
              x={PAD + (i / (graphData.length - 1)) * (W - PAD * 2)}
              y={H - 2}
              textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.3)"
            >
              {graphData[i] ? format(parseISO(graphData[i].date), "M/d") : ""}
            </text>
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.6rem", marginTop: "0.6rem", fontSize: "0.82rem", color: "var(--dim)" }}>
          <span>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#c9a84c", marginRight: "0.4rem", verticalAlign: "middle" }} />
            内向き活動（重力＝飴）
          </span>
          <span>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#3a6fc9", marginRight: "0.4rem", verticalAlign: "middle" }} />
            外向き測定（引力＝雨）
          </span>
        </div>
        </>)}
      </div>

      {/* AI役割カード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { icon: "✨", name: "メンター（重力）", desc: "夢や熱量を肯定し、言葉を砂として堆積させる" },
          { icon: "📊", name: "アナリスト（引力）", desc: "数値から冷徹に現状を測定する" },
          { icon: "🌧", name: "演出家（システム）", desc: "時刻と環境に合わせ、雨の強さを調律する" },
        ].map(({ icon, name, desc }) => (
          <div key={name} style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
            borderRadius: "0.4rem",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{icon}</div>
            <div style={{ color: "var(--amber)", fontWeight: 600, fontSize: "0.85rem", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{name}</div>
            <div style={{ color: "var(--dim)", fontSize: "0.75rem", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

    </div>
  )
}

function BigCard({ color, colorDim, colorBg, icon, title, sub, desc, stat, onClick }: {
  color: string; colorDim: string; colorBg: string
  icon: string; title: string; sub: string; desc: string; stat: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bigcard-btn"
      style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        padding: "2rem 1.4rem 1.6rem",
        background: colorBg,
        backdropFilter: "blur(8px)",
        border: `1.5px solid ${colorDim}`,
        borderRadius: "0.5rem",
        cursor: "pointer",
        color: "var(--text)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color
        ;(e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 20px ${color}22`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = colorDim
        ;(e.currentTarget as HTMLElement).style.transform = ""
        ;(e.currentTarget as HTMLElement).style.boxShadow = ""
      }}
    >
      {/* radial glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 0%, ${color} 0%, transparent 60%)`,
        opacity: 0.06, pointerEvents: "none",
      }} />
      <div style={{
        fontSize: "2.4rem", marginBottom: "0.6rem",
        filter: `drop-shadow(0 0 10px ${color}66)`,
      }}>
        {icon}
      </div>
      <div style={{
        fontFamily: "'Noto Serif JP', serif",
        fontSize: "1.5rem", fontWeight: 400,
        letterSpacing: "0.12em",
        color: color, marginBottom: "0.2rem",
      }}>
        {title}
      </div>
      <div style={{
        fontSize: "0.7rem", letterSpacing: "0.25em",
        color: "var(--dim)", marginBottom: "0.8rem",
        fontFamily: "monospace", textTransform: "uppercase",
      }}>
        {sub}
      </div>
      <p style={{
        fontSize: "0.85rem", lineHeight: 1.7,
        color: "rgba(255,255,255,0.72)", marginBottom: "1rem",
      }}>
        {desc}
      </p>
      <div style={{ fontSize: "0.72rem", color: "var(--dim)", fontFamily: "monospace" }}>
        {stat}
      </div>
      <div style={{
        marginTop: "1.2rem", fontSize: "0.8rem", color: color,
        letterSpacing: "0.08em", padding: "0.4rem 0.9rem",
        border: `1px solid ${colorDim}`, borderRadius: "999px",
        transition: "all 0.25s ease",
      }}>
        開く →
      </div>
    </button>
  )
}
