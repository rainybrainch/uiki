"use client"

import { format, parseISO } from "date-fns"

type DataPoint = { date: string; gravityScore: number; attractionScore: number }

export function GrowthGraph({ data }: { data: DataPoint[] }) {
  const maxG = Math.max(...data.map((d) => d.gravityScore), 1)
  const W = 100
  const H = 60

  const gPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (d.gravityScore / maxG) * H
    return `${x},${y}`
  }).join(" ")

  const aPoints = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - d.attractionScore * H
    return `${x},${y}`
  }).join(" ")

  return (
    <div className="surface rounded-xl p-5">
      <p className="section-label mb-4">成長グラフ（14日）</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <polyline points={gPoints} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points={aPoints} fill="none" stroke="#3a6fc9" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: "#c9a84c" }} />
          <span className="text-xs text-dim">重力雨域</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: "#3a6fc9" }} />
          <span className="text-xs text-dim">引力雨域</span>
        </div>
        <span className="text-xs text-faint ml-auto">
          {format(parseISO(data[0].date), "M/d")} 〜 {format(parseISO(data[data.length - 1].date), "M/d")}
        </span>
      </div>
    </div>
  )
}
