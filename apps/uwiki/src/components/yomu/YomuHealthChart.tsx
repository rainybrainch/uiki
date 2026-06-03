"use client"

import { format, parseISO } from "date-fns"

export function YomuHealthChart({ label, unit, dates, values }: {
  label: string
  unit: string
  dates: string[]
  values: number[]
}) {
  if (dates.length === 0) return null

  const latest = values[values.length - 1]
  const prev   = values[values.length - 2]
  const trend  = prev !== undefined ? latest - prev : 0

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const W = 400; const H = 60; const PAD = 8

  const points = values.map((v, i) => {
    const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2)
    const y = (H - PAD) - ((v - min) / range) * (H - PAD * 2)
    return `${x},${y}`
  }).join(" ")

  return (
    <div className="surface rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-serif font-light" style={{ color: "#3a6fc9" }}>
            {latest}
          </span>
          <span className="text-xs text-dim">{unit}</span>
          {trend !== 0 && (
            <span className="text-xs font-mono" style={{ color: trend > 0 ? "var(--red)" : "var(--green)" }}>
              {trend > 0 ? "↑" : "↓"}{Math.abs(trend).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 56 }}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a6fc9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3a6fc9" stopOpacity="0" />
          </linearGradient>
        </defs>
        {values.length > 1 && (
          <polygon
            points={`${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`}
            fill={`url(#g-${label})`}
          />
        )}
        <polyline
          points={points}
          fill="none"
          stroke="#3a6fc9"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((v, i) => {
          const cx = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2)
          const cy = (H - PAD) - ((v - min) / range) * (H - PAD * 2)
          const isLast = i === values.length - 1
          return (
            <g key={i}>
              {isLast && (
                <circle cx={cx} cy={cy} r="6" fill="#3a6fc9" opacity="0.2">
                  <animate attributeName="r" values="4;8;4" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={cx} cy={cy} r={isLast ? 3 : 2} fill="#3a6fc9" />
            </g>
          )
        })}
      </svg>

      <div className="flex justify-between mt-1 text-[10px] font-mono text-faint">
        <span>{dates[0] ? format(parseISO(dates[0]), "M/d") : ""}</span>
        <span>{dates[dates.length - 1] ? format(parseISO(dates[dates.length - 1]), "M/d") : ""}</span>
      </div>
    </div>
  )
}
