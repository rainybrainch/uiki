"use client"

import { useState, useTransition } from "react"
import { toggleTask, deleteTask, updateTask } from "@/actions/tasks"
import { TaskCheckbox } from "./TaskCheckbox"
import { SubTaskList } from "./SubTaskList"
import { formatDisplay } from "@/lib/date"
import { format, isToday, isPast, startOfDay } from "date-fns"
import { Trash2, Pencil, ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

type SubTask = { id: string; title: string; completed: boolean }

type Task = {
  id: string
  title: string
  memo: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  dueDate: Date | null
  column: string
  completed: boolean
  tags: string | null
  recurrence: string | null
  subtasks: SubTask[]
}

const priorityColor: Record<string, string> = {
  HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
}

const recLabel: Record<string, string> = {
  daily: "毎日", weekly: "毎週", monthly: "毎月",
}

export function TaskList({ tasks, dimmed }: { tasks: Task[]; dimmed?: boolean }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-center py-8 text-faint">タスクはありません</p>
  }
  return (
    <ul className="space-y-1">
      {tasks.map((task) => <TaskItem key={task.id} task={task} dimmed={dimmed} />)}
    </ul>
  )
}

function TaskItem({ task, dimmed }: { task: Task; dimmed?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [cancelling, setCancelling] = useState(false)
  const [pending, startTransition] = useTransition()

  const saveEdit = () => {
    if (cancelling) { setCancelling(false); return }
    if (!editTitle.trim()) return
    startTransition(async () => {
      await updateTask(task.id, { title: editTitle.trim() })
      setEditing(false)
    })
  }

  const cancelEdit = () => {
    setCancelling(true)
    setEditTitle(task.title)
    setEditing(false)
  }

  const tags = task.tags ? task.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  const hasSubtasks = task.subtasks.length > 0

  const dueDateObj = task.dueDate ? startOfDay(new Date(task.dueDate)) : null
  const isOverdue = dueDateObj && !task.completed && isPast(dueDateObj) && !isToday(dueDateObj)
  const isDueToday = dueDateObj && !task.completed && isToday(dueDateObj)
  const dueDateColor = isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : "var(--dim)"

  return (
    <li className={clsx("rounded-lg transition-colors", dimmed && "opacity-40")}>
      <div className="flex items-start gap-3 px-3 py-3 hover:bg-[var(--faint)] rounded-lg group">
        {/* 展開ボタン */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 p-0.5 rounded text-dim hover:text-white transition-colors shrink-0"
          style={{ visibility: hasSubtasks ? "visible" : "hidden" }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <TaskCheckbox taskId={task.id} completed={task.completed} />

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              className="input-field text-sm py-0.5"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
              onBlur={saveEdit}
            />
          ) : (
            <p className={clsx("text-sm leading-snug", task.completed && "line-through text-dim")}>
              {task.title}
            </p>
          )}

          {/* メタ情報行 */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.dueDate && (
              <span className="text-[10px] font-mono" style={{ color: dueDateColor }}>
                {isOverdue && "⚠ "}{formatDisplay(format(new Date(task.dueDate), "yyyy-MM-dd"))}
              </span>
            )}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-[10px] badge">
                <RotateCcw size={9} /> {recLabel[task.recurrence]}
              </span>
            )}
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] badge">{tag}</span>
            ))}
            {task.memo && !expanded && (
              <span className="text-[10px] text-faint truncate max-w-[160px]">{task.memo}</span>
            )}
          </div>

          {/* サブタスク */}
          {expanded && (
            <SubTaskList taskId={task.id} subtasks={task.subtasks} />
          )}
        </div>

        {/* 優先度 + アクション */}
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: priorityColor[task.priority] }}
        />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Link
            href={`/tasks/${task.id}`}
            className="p-1 rounded hover:bg-[var(--faint)] text-dim"
          >
            <Pencil size={12} />
          </Link>
          <button
            onClick={() => startTransition(() => deleteTask(task.id))}
            className="p-1 rounded hover:bg-[var(--faint)] text-dim"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </li>
  )
}
