"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, Check } from "lucide-react"
import { createTask } from "@/actions/tasks"
import { format, addDays } from "date-fns"

type Project = { id: string; name: string; color: string }

function parseDueDate(token: string): string | undefined {
  const t = token.toLowerCase()
  const today = new Date()
  if (t === "#today" || t === "#今日") return format(today, "yyyy-MM-dd")
  if (t === "#tomorrow" || t === "#明日") return format(addDays(today, 1), "yyyy-MM-dd")
  const mdMatch = token.match(/^#(\d{1,2})\/(\d{1,2})$/)
  if (mdMatch) {
    const m = mdMatch[1].padStart(2, "0"), d = mdMatch[2].padStart(2, "0")
    return `${format(today, "yyyy")}-${m}-${d}`
  }
  const isoMatch = token.match(/^#(\d{4}-\d{2}-\d{2})$/)
  if (isoMatch) return isoMatch[1]
  return undefined
}

function parseInput(value: string, projects: Project[]) {
  let priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM"
  let projectId: string | undefined
  let dueDate: string | undefined
  let title = value.trim()

  if (title.startsWith("!")) { priority = "HIGH"; title = title.slice(1).trim() }
  else if (title.startsWith("~")) { priority = "LOW"; title = title.slice(1).trim() }

  const atMatch = title.match(/@(\S+)/)
  if (atMatch) {
    const pName = atMatch[1].toLowerCase()
    const found = projects.find((p) => p.name.toLowerCase().includes(pName))
    if (found) {
      projectId = found.id
      title = title.replace(atMatch[0], "").trim()
    }
  }

  const hashMatch = title.match(/#\S+/)
  if (hashMatch) {
    const parsed = parseDueDate(hashMatch[0])
    if (parsed) {
      dueDate = parsed
      title = title.replace(hashMatch[0], "").trim()
    }
  }

  return { title, priority, projectId, dueDate }
}

function getHint(value: string): string | null {
  if (value.startsWith("!")) return "高優先度"
  if (value.startsWith("~")) return "低優先度"
  if (value.includes("@")) return "@プロジェクト名で自動割り当て"
  if (value.includes("#today") || value.includes("#今日")) return "期限: 今日"
  if (value.includes("#tomorrow") || value.includes("#明日")) return "期限: 明日"
  const mdMatch = value.match(/#(\d{1,2}\/\d{1,2})/)
  if (mdMatch) return `期限: ${mdMatch[1]}`
  if (value.includes("#")) return "#today #tomorrow #MM/DD で期限設定"
  return null
}

export function QuickAddTask({ projects = [] }: { projects?: Project[] }) {
  const [value, setValue] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const hint = getHint(value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    const parsed = parseInput(value, projects)
    if (!parsed.title) {
      setError("タイトルが空です")
      return
    }
    setError(null)
    startTransition(async () => {
      await createTask({ title: parsed.title, priority: parsed.priority, projectId: parsed.projectId, dueDate: parsed.dueDate })
      setValue("")
      setDone(true)
      setTimeout(() => {
        setDone(false)
        inputRef.current?.focus()
      }, 1000)
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}
        className="flex items-center gap-3 px-4 rounded-2xl transition-all"
        style={{
          background: done ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${done ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.1)"}`,
          height: 52,
          transition: "border-color 0.3s, background 0.3s",
          backdropFilter: "blur(8px)",
        }}
        onFocus={(e) => { if (!done) (e.currentTarget as HTMLFormElement).style.borderColor = "rgba(58,111,201,0.5)" }}
        onBlur={(e) => { if (!done) (e.currentTarget as HTMLFormElement).style.borderColor = "rgba(255,255,255,0.1)" }}
      >
        <div className="shrink-0 flex items-center justify-center w-5 h-5">
          {done
            ? <Check size={15} style={{ color: "var(--green)" }} className="animate-check-pop" />
            : <Plus size={15} style={{ color: "var(--dim)" }} />
          }
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={done ? "追加しました" : "今日やることを追加... (!高優先 ~低優先 @project #today)"}
          className="flex-1 bg-transparent outline-none"
          style={{
            fontSize: "0.9375rem",
            color: done ? "var(--green)" : "var(--text)",
          }}
          disabled={isPending}
        />
        {value && !done && (
          <button type="submit" disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg shrink-0 font-medium transition-opacity"
            style={{ background: "var(--accent)", color: "white", opacity: isPending ? 0.5 : 1 }}>
            追加
          </button>
        )}
      </form>
      {error && !done && (
        <p className="text-[10px] mt-1.5 px-1" style={{ color: "var(--red)" }}>{error}</p>
      )}
      {hint && !done && !error && (
        <p className="text-[10px] mt-1.5 px-1" style={{ color: "var(--dim)" }}>{hint}</p>
      )}
    </div>
  )
}
