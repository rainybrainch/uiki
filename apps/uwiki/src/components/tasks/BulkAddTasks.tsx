"use client"

import { useState, useTransition } from "react"
import { createTasksBulk } from "@/actions/tasks"
import { ListPlus, Check } from "lucide-react"

export function BulkAddTasks({ projectId }: { projectId?: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const highCount = lines.filter((l) => l.startsWith("!")).length
  const lowCount  = lines.filter((l) => l.startsWith("~")).length

  const submit = () => {
    if (!lines.length) return
    startTransition(async () => {
      await createTasksBulk(lines, projectId)
      setText("")
      setDone(true)
      setTimeout(() => { setDone(false); setOpen(false) }, 1500)
    })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
        style={{
          background: open ? "rgba(58,111,201,0.15)" : "transparent",
          color: open ? "var(--accent)" : "var(--dim)",
          border: `1px solid ${open ? "rgba(58,111,201,0.3)" : "var(--border)"}`,
        }}
      >
        <ListPlus size={13} />
        一括追加
      </button>

      {open && (
        <div className="mt-2 surface rounded-xl p-4 space-y-3 animate-fade-in-fast">
          <p className="text-[11px]" style={{ color: "var(--dim)" }}>
            1行1タスク。<span style={{ color: "var(--red)" }}>!</span> = 高優先度　<span style={{ color: "var(--faint)" }}>~</span> = 低優先度
          </p>
          <textarea
            className="input-field resize-none text-xs font-mono w-full"
            rows={6}
            placeholder={"!緊急タスク\n通常タスク\n~後回しでいいタスク"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--dim)" }}>{lines.length} 件</span>
              {highCount > 0 && <span className="text-[10px] font-mono" style={{ color: "var(--red)" }}>!{highCount}</span>}
              {lowCount > 0  && <span className="text-[10px] font-mono" style={{ color: "var(--faint)" }}>~{lowCount}</span>}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs" onClick={() => setOpen(false)}>キャンセル</button>
              <button
                className="btn-primary text-xs flex items-center gap-1.5"
                onClick={submit}
                disabled={isPending || !lines.length}
              >
                {done
                  ? <><Check size={12} />追加済み</>
                  : `${lines.length || ""}件を追加`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
