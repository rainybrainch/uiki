"use client"

import { useState, useTransition } from "react"
import { moveTask, deleteTask } from "@/actions/tasks"
import { Trash2 } from "lucide-react"
import clsx from "clsx"
import Link from "next/link"
import { isToday, isPast, startOfDay } from "date-fns"
import type { KanbanColumn } from "@/actions/tasks"

type Task = {
  id: string; title: string; memo: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"; dueDate: Date | null
  column: string; completed: boolean
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
    <div className="flex gap-4 h-full overflow-x-auto pb-2">
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
      className="flex flex-col shrink-0 w-72 rounded-xl transition-colors duration-150"
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
  const [, startTransition] = useTransition()

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id)
    e.dataTransfer.effectAllowed = "move"
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
        task.completed && "opacity-40"
      )}
      style={{
        background: hovered ? "rgba(58,111,201,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "var(--border-h)" : "var(--border)"}`,
      }}
    >
      <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full" style={{ background: priorityColor[task.priority] }} />
      <Link
        href={`/tasks/${task.id}`}
        className={clsx("block text-sm leading-snug pl-3 hover:text-accent transition-colors", task.completed && "line-through")}
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </Link>
      {task.memo && <p className="text-xs mt-1.5 pl-3 line-clamp-2 text-dim">{task.memo}</p>}
      {task.dueDate && (
        <p className="text-[10px] mt-2 pl-3 font-mono" style={{ color: dueDateColor }}>
          {isOverdue && "⚠ "}{new Date(task.dueDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
        </p>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); startTransition(() => deleteTask(task.id)) }}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--faint)] text-dim"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
