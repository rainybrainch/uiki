"use client"

import { useTransition } from "react"
import { moveTask, deleteTask } from "@/actions/tasks"
import { Trash2, GripVertical } from "lucide-react"
import clsx from "clsx"
import type { KanbanColumn } from "@/actions/tasks"

type Task = {
  id: string
  title: string
  memo: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  dueDate: Date | null
  column: string
  completed: boolean
}

type Column = { id: string; label: string }

const priorityColor: Record<string, string> = {
  HIGH: "var(--red)",
  MEDIUM: "var(--accent)",
  LOW: "var(--dim)",
}

const columnAccent: Record<string, string> = {
  todo:  "var(--dim)",
  doing: "var(--accent)",
  done:  "var(--green)",
}

export function KanbanBoard({ columns, tasks }: { columns: Column[]; tasks: Task[] }) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-2">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          column={col}
          tasks={tasks.filter((t) => t.column === col.id)}
        />
      ))}
    </div>
  )
}

function KanbanColumn({ column, tasks }: { column: Column; tasks: Task[] }) {
  const [pending, startTransition] = useTransition()

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    ;(e.currentTarget as HTMLElement).style.background = "rgba(58,111,201,0.06)"
  }
  const onDragLeave = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.background = ""
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).style.background = ""
    const taskId = e.dataTransfer.getData("taskId")
    if (taskId) startTransition(() => moveTask(taskId, column.id as KanbanColumn))
  }

  return (
    <div
      className="flex flex-col shrink-0 w-72 rounded-xl transition-colors duration-150"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* 列ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: columnAccent[column.id] }} />
          <span className="text-xs font-medium">{column.label}</span>
        </div>
        <span className="badge">{tasks.length}</span>
      </div>

      {/* カード列 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[120px]">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div
            className="text-center py-10 text-xs rounded-xl border border-dashed mt-1"
            style={{ color: "var(--faint)", borderColor: "rgba(58,111,201,0.15)" }}
          >
            ドロップ
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanCard({ task }: { task: Task }) {
  const [pending, startTransition] = useTransition()

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={clsx(
        "group relative p-3 rounded-lg cursor-grab active:cursor-grabbing select-none",
        "transition-all duration-150",
        task.completed && "opacity-40"
      )}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-h)"
        ;(e.currentTarget as HTMLElement).style.background = "rgba(58,111,201,0.05)"
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"
      }}
    >
      {/* 優先度ライン */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: priorityColor[task.priority] }}
      />

      <p className={clsx("text-sm leading-snug pl-3", task.completed && "line-through")}>{task.title}</p>

      {task.memo && (
        <p className="text-xs mt-1.5 pl-3 line-clamp-2 text-dim">{task.memo}</p>
      )}

      {task.dueDate && (
        <p className="text-[10px] mt-2 pl-3 font-mono text-dim">
          {new Date(task.dueDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
        </p>
      )}

      <button
        onClick={() => startTransition(() => deleteTask(task.id))}
        disabled={pending}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--faint)] text-dim"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}
