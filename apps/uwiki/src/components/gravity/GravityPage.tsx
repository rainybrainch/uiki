"use client"

import { useState } from "react"
import { GravityMain } from "./GravityMain"
import { GravityInternal } from "./GravityInternal"
import { GravityExternal } from "./GravityExternal"

type Tab = "main" | "internal" | "external"

export function GravityPage({ gravityLogs, metrics, graphData }: {
  gravityLogs: any[]
  metrics: any[]
  graphData: { date: string; gravityScore: number; attractionScore: number }[]
}) {
  const [tab, setTab] = useState<Tab>("main")

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "4rem" }}>
      {/* ヒーロー */}
      <div style={{
        padding: "3.5rem 2.5rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <h1 style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: "clamp(2rem, 5vw, 2.8rem)",
          fontWeight: 400,
          letterSpacing: "0.15em",
          color: "var(--amber)",
          marginBottom: "0.4rem",
        }}>
          雨域 <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.7em", letterSpacing: "0.25em" }}>Uwiki</span>
        </h1>
        <p style={{ color: "var(--dim)", fontSize: "0.9rem", letterSpacing: "0.08em" }}>
          重力と引力の二重奏 ── 内に降り、外で測られる
        </p>
      </div>

      {/* タブナビ */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "0.5rem",
        padding: "0 2rem 1.5rem",
      }}>
        {([
          { id: "main",     label: "概観" },
          { id: "internal", label: "重力雨域" },
          { id: "external", label: "引力雨域" },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "0.45rem 1.2rem",
              borderRadius: "999px",
              fontSize: "0.82rem",
              fontFamily: "'Noto Serif JP', serif",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.25s ease",
              background: tab === id
                ? id === "internal" ? "rgba(201,168,76,0.15)" : id === "external" ? "rgba(58,111,201,0.15)" : "rgba(255,255,255,0.08)"
                : "transparent",
              border: `1px solid ${
                tab === id
                  ? id === "internal" ? "#c9a84c" : id === "external" ? "#3a6fc9" : "rgba(255,255,255,0.3)"
                  : "var(--border)"
              }`,
              color: tab === id
                ? id === "internal" ? "#c9a84c" : id === "external" ? "#3a6fc9" : "white"
                : "var(--dim)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 2rem" }}>
        {tab === "main"     && <GravityMain graphData={graphData} onNav={setTab} gravityLogs={gravityLogs} metrics={metrics} />}
        {tab === "internal" && <GravityInternal logs={gravityLogs} />}
        {tab === "external" && <GravityExternal metrics={metrics} />}
      </div>
    </div>
  )
}
