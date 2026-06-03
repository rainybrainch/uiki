"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { createGravityLog } from "@/actions/gravity"

const INTENSITY_LABELS = ["", "微熱", "燃焼", "臨界"] as const
const INTENSITY_COLORS = ["", "#c9a84c66", "#c9a84c99", "#c9a84c"] as const

export function GravitySection({ logs }: { logs: any[] }) {
  const [text, setText] = useState("")
  const [intensity, setIntensity] = useState(1)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    startTransition(async () => {
      await createGravityLog({ text: text.trim(), intensity })
      setText("")
      setIntensity(1)
    })
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ background: "#c9a84c" }} />
        <h2 className="text-sm font-medium" style={{ color: "#c9a84c" }}>重力雨域</h2>
        <span className="text-xs text-faint">— 内向きの密度・熱量・思い</span>
      </div>

      <form onSubmit={handleSubmit} className="surface rounded-xl p-4 mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="今日の重力を書く（280字まで）"
          rows={3}
          className="w-full bg-transparent text-sm resize-none outline-none text-white placeholder:text-faint"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setIntensity(lvl)}
                className="px-3 py-1 rounded-full text-xs transition-all"
                style={{
                  background: intensity === lvl ? INTENSITY_COLORS[lvl] : "var(--faint)",
                  color: intensity === lvl ? "white" : "var(--dim)",
                  border: `1px solid ${intensity === lvl ? "#c9a84c" : "transparent"}`,
                }}
              >
                {INTENSITY_LABELS[lvl]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-faint font-mono">{text.length}/280</span>
            <button
              type="submit"
              disabled={!text.trim() || isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
              style={{ background: "#c9a84c22", color: "#c9a84c", border: "1px solid #c9a84c44" }}
            >
              降らせる
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-center py-8 text-sm text-faint">重力をまだ降らせていない</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="surface rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: `${INTENSITY_COLORS[log.intensity]}33`, color: "#c9a84c" }}
                >
                  {INTENSITY_LABELS[log.intensity]}
                </span>
                <span className="text-xs text-faint font-mono">
                  {format(new Date(log.createdAt), "M/d", { locale: ja })}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{log.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
