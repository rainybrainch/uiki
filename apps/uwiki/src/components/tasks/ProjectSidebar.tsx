"use client"

import Link from "next/link"
import { useTransition, useState } from "react"
import { createProject, deleteProject } from "@/actions/projects"
import { Plus, Trash2, Layers, Sun, Calendar, AlertCircle, Kanban, GitBranch } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import clsx from "clsx"
import type { SmartViewDef } from "@/app/tasks/page"

type SmartView = SmartViewDef
type Project = { id: string; name: string; color: string; _count: { tasks: number } }

const VIEW_ICONS: Record<string, React.ElementType> = {
  all:      Layers,
  today:    Sun,
  upcoming: Calendar,
  overdue:  AlertCircle,
  board:    Kanban,
  flow:     GitBranch,
}

const PROJECT_COLORS = ["#3a6fc9","#2456b8","#6366f1","#8b5cf6","#ec4899","#10b981","#f59e0b","#ef4444"]

export function ProjectSidebar({
  projects, currentProject, currentView, smartViews,
}: {
  projects: Project[]
  currentProject: string
  currentView: string
  smartViews: SmartView[]
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!name.trim()) return
    startTransition(async () => {
      await createProject({ name: name.trim(), color })
      setName(""); setAdding(false)
    })
  }

  return (
    <div
      className="hidden sm:flex w-40 lg:w-48 xl:w-56 shrink-0 flex-col h-full overflow-y-auto"
      style={{ borderRight: "1px solid var(--border)", background: "rgba(6,12,26,0.5)" }}
    >
      <div className="px-3 pt-5 pb-3">
        {/* スマートリスト */}
        <p className="text-[9px] font-mono text-faint tracking-widest mb-2 px-2">ビュー</p>
        <nav className="space-y-0.5 mb-5">
          {smartViews.map(({ id, label, count }) => {
            const active = currentProject === "all" && currentView === id
            const Icon = VIEW_ICONS[id] ?? Layers
            return (
              <Link
                key={id}
                href={`/tasks?view=${id}`}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all",
                  active
                    ? id === "overdue" ? "font-medium text-white bg-[rgba(248,113,113,0.15)]" : "font-medium text-white bg-[rgba(36,86,184,0.2)]"
                    : "text-dim hover:text-white hover:bg-[var(--faint)]"
                )}
                style={active
                  ? { border: `1px solid ${id === "overdue" ? "rgba(248,113,113,0.35)" : "rgba(58,111,201,0.28)"}` }
                  : {}}
              >
                <Icon size={13} strokeWidth={active ? 2 : 1.5}
                  style={{ color: active ? (id === "overdue" ? "var(--red)" : "var(--accent)") : id === "overdue" && count && count > 0 ? "var(--red)" : "inherit" }} />
                <span className="flex-1" style={{ color: id === "overdue" && count && count > 0 && !active ? "var(--red)" : undefined }}>{label}</span>
                {count !== null && count > 0 && (
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded"
                    style={{
                      color: id === "overdue" ? "var(--red)" : active ? "var(--accent)" : "var(--faint)",
                      background: id === "overdue" && count > 0 ? "rgba(248,113,113,0.12)" : "transparent",
                    }}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* プロジェクト */}
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-[9px] font-mono text-faint tracking-widest">プロジェクト</p>
          <button
            onClick={() => setAdding(!adding)}
            className="p-0.5 rounded hover:bg-[var(--faint)] text-dim hover:text-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* 新規プロジェクト追加 */}
        {adding && (
          <div className="mb-3 px-2 space-y-2">
            <input
              autoFocus
              className="input-field text-xs py-1.5"
              placeholder="プロジェクト名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setAdding(false) }}
            />
            <div className="flex gap-1 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-4 h-4 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: color === c ? "white" : "transparent",
                    transform: color === c ? "scale(1.2)" : "scale(1)",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button className="btn-ghost text-[10px] py-1 px-2" onClick={() => setAdding(false)}>キャンセル</button>
              <button className="btn-primary text-[10px] py-1 px-2" onClick={submit} disabled={pending || !name.trim()}>追加</button>
            </div>
          </div>
        )}

        <nav className="space-y-0.5">
          {projects.map((project) => {
            const active = currentProject === project.id
            return (
              <div key={project.id} className="group flex items-center gap-1">
                <Link
                  href={`/tasks?view=all&project=${project.id}`}
                  className={clsx(
                    "flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all",
                    active ? "font-medium text-white" : "text-dim hover:text-white hover:bg-[var(--faint)]"
                  )}
                  style={active ? {
                    background: `${project.color}20`,
                    border: `1px solid ${project.color}40`,
                  } : {}}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: project.color }} />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project._count.tasks > 0 && (
                    <span className="text-[9px] font-mono"
                      style={{ color: active ? project.color : "var(--faint)" }}>
                      {project._count.tasks}
                    </span>
                  )}
                </Link>
                <ConfirmButton
                  onConfirm={() => startTransition(() => deleteProject(project.id))}
                  size="xs"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--faint)] transition-all"
                />
              </div>
            )
          })}
          {projects.length === 0 && (
            <p className="text-[10px] text-faint px-2 py-2">+ でプロジェクトを追加</p>
          )}
        </nav>
      </div>
    </div>
  )
}
