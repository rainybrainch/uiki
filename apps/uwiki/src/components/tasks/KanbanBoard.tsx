"use client"

import { useState, useTransition } from "react"
import { moveTask, deleteTask, toggleTask } from "@/actions/tasks"
import { ArrowRight } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import clsx from "clsx"
import Link from "next/link"
import { isToday, isPast, startOfDay } from "date-fns"
import type { KanbanColumn } from "@/actions/tasks"

type Task = {
  id: string; title: string; memo: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"; dueDate: Date | null
  column: string; completed: boolean
  project?: { id: string; name: string; color: string } | null
}
type Column = { id: string; label: string }

const priorityColor: Record<string, string> = {
  HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
}
const columnAccent: Record<string, string> = {
  todo: "var(--dim)", doing: "var(--accent)", done: "var(--green)",
}

export function KanbanBoard({ columns, tasks }: { columns: Column[]; tasks: Task[] }) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-2 xl:gap-6">
      {columns.map((col) => (
        <KanbanCol key={col.id} column={col} tasks={tasks.filter((t) => t.column === col.id)} />
      ))}
    </div>
  )
}

function KanbanCol({ column, tasks }: { column: Column; tasks: Task[] }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [, startTransition] = useTransition()

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setIsDragOver(true) }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData("taskId")
    if (taskId) startTransition(() => moveTask(taskId, column.id as KanbanColumn))
  }

  return (
    <div
      className="flex flex-col shrink-0 w-72 xl:w-80 rounded-xl transition-colors duration-150"
      style={{
        background: isDragOver ? "rgba(58,111,201,0.08)" : "var(--surface)",
        border: `1px solid ${isDragOver ? "var(--border-h)" : "var(--border)"}`,
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: columnAccent[column.id] }} />
          <span className="text-xs font-medium">{column.label}</span>
        </div>
        <span className="badge">{tasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[120px]">
        {tasks.map((task) => <KanbanCard key={task.id} task={task} />)}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-xs rounded-xl border border-dashed mt-1" style={{ color: "var(--faint)", borderColor: "rgba(58,111,201,0.15)" }}>
            {isDragOver ? "ここに放す" : "ドロップ"}
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanCard({ task }: { task: Task }) {
  const [hovered, setHovered] = useState(false)
  const [popping, setPopping] = useState(false)
  const [optimistic, setOptimistic] = useState<boolean | null>(null)
  const [, startTransition] = useTransition()

  const shown = optimistic !== null ? optimistic : task.completed

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !shown
    setOptimistic(next)
    if (next) { setPopping(true); setTimeout(() => setPopping(false), 350) }
    startTransition(async () => {
      await toggleTask(task.id, next)
      setOptimistic(null)
    })
  }

  const dueDateObj = task.dueDate ? startOfDay(new Date(task.dueDate)) : null
  const isOverdue = dueDateObj && !task.completed && isPast(dueDateObj) && !isToday(dueDateObj)
  const isDueToday = dueDateObj && !task.completed && isToday(dueDateObj)
  const dueDateColor = isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : "var(--dim)"

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        "group relative p-3 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all duration-150",
        shown && "opacity-40"
      )}
      style={{
        background: hovered ? "rgba(58,111,201,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "var(--border-h)" : "var(--border)"}`,
      }}
    >
      <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full" style={{ background: priorityColor[task.priority] }} />

      {/* チェックボックス + タイトル */}
      <div className="flex items-start gap-2 pl-2">
        <button
          onClick={handleCheck}
          aria-label={shown ? "タスクを未完了にする" : "タスクを完了にする"}
          aria-pressed={shown}
          className={`mt-0.5 shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer ${popping ? "animate-check-pop" : ""}`}
          style={{
            borderColor: shown ? "var(--accent)" : "var(--border)",
            background: shown ? "var(--accent-2)" : "transparent",
          }}
        >
          {shown && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 2.5L3 4.5L7 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <Link
          href={`/tasks/${task.id}`}
          className={clsx("flex-1 text-sm leading-snug hover:text-accent transition-colors", shown && "line-through")}
          onClick={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
      </div>

      {task.memo && <p className="text-xs mt-1.5 pl-7 line-clamp-2 text-dim">{task.memo}</p>}
      {task.project && (
        <div className="flex items-center gap-1 mt-1.5 pl-7">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: task.project.color }} />
          <span className="text-[10px] truncate" style={{ color: task.project.color, opacity: 0.8 }}>{task.project.name}</span>
        </div>
      )}
      {task.dueDate && (
        <p className="text-[10px] mt-2 pl-7 font-mono" style={{ color: dueDateColor }}>
          {isOverdue && "⚠ "}{new Date(task.dueDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
        </p>
      )}
      {/* モバイル移動ボタン */}
      <div className="flex gap-1 mt-2 sm:hidden">
        {(["todo","doing","done"] as KanbanColumn[]).filter((c) => c !== task.column).map((col) => {
          const labels: Record<string, string> = { todo: "未着手", doing: "進行中", done: "完了" }
          return (
            <button key={col} onClick={(e) => { e.stopPropagation(); startTransition(() => moveTask(task.id, col)) }}
              className="flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg transition-colors"
              style={{ background: "var(--faint)", color: "var(--dim)" }}>
              <ArrowRight size={9} /> {labels[col]}
            </button>
          )
        })}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <ConfirmButton
          onConfirm={() => startTransition(() => deleteTask(task.id))}
          size="xs"
          className="p-1 rounded hover:bg-[var(--faint)]"
        />
      </div>
    </div>
  )
}
