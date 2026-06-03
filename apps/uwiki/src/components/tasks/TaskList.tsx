"use client"

import { useState, useTransition } from "react"
import { toggleTask, deleteTask, updateTask } from "@/actions/tasks"
import { TaskCheckbox } from "./TaskCheckbox"
import { SubTaskList } from "./SubTaskList"
import { formatDisplay } from "@/lib/date"
import { format, isToday, isPast, startOfDay } from "date-fns"
import { Trash2, Pencil, ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import { TagLink } from "./TagLink"
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
    return (
      <div className="text-center py-10">
        <div className="text-2xl mb-2 opacity-20">☁</div>
        <p className="text-xs text-faint">タスクはありません</p>
      </div>
    )
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
  const isOverdue  = dueDateObj && !task.completed && isPast(dueDateObj) && !isToday(dueDateObj)
  const isDueToday = dueDateObj && !task.completed && isToday(dueDateObj)
  const daysUntil  = dueDateObj && !task.completed
    ? Math.ceil((dueDateObj.getTime() - startOfDay(new Date()).getTime()) / 86400000)
    : null
  const dueDateColor = isOverdue ? "var(--red)" : isDueToday ? "var(--amber)" : daysUntil !== null && daysUntil <= 3 ? "#f59e0b" : "var(--dim)"
  const dueDateLabel = isOverdue
    ? `${Math.abs(daysUntil ?? 0)}日超過`
    : isDueToday ? "今日"
    : daysUntil === 1 ? "明日"
    : daysUntil !== null ? `${daysUntil}日後`
    : null

  return (
    <li className={clsx("rounded-lg overflow-hidden", dimmed && "opacity-40")}
      style={{
        ...(task.priority === "HIGH" && !task.completed ? { borderLeft: "3px solid var(--red)" } : {}),
        transition: "opacity 0.3s",
      }}>
      <div className="flex items-start gap-3 px-3 py-3.5 hover:bg-[var(--faint)] rounded-lg group">
        {/* 展開ボタン（サブタスクまたはメモがある時のみ表示） */}
        {(hasSubtasks || task.memo) ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 p-0.5 rounded text-dim hover:text-white transition-colors shrink-0"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

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
            <p className="text-sm leading-snug" style={{
              textDecoration: task.completed ? "line-through" : "none",
              color: task.completed ? "var(--dim)" : "var(--text)",
              opacity: task.completed ? 0.55 : 1,
              transition: "color 0.25s, opacity 0.25s, text-decoration 0.2s",
            }}>
              {task.title}
            </p>
          )}

          {/* メタ情報行 */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dueDateLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: `${dueDateColor}18`, color: dueDateColor, border: `1px solid ${dueDateColor}33` }}>
                {isOverdue && "⚠ "}{dueDateLabel}
              </span>
            )}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-[10px] badge">
                <RotateCcw size={9} /> {recLabel[task.recurrence]}
              </span>
            )}
            {/* サブタスク進捗 */}
            {hasSubtasks && !task.completed && (() => {
              const done = task.subtasks.filter((s: SubTask) => s.completed).length
              const total = task.subtasks.length
              const pct = Math.round((done / total) * 100)
              const allDone = done === total
              return (
                <span className="flex items-center gap-1.5 text-[10px] font-mono"
                  style={{ color: allDone ? "var(--green)" : "var(--dim)" }}>
                  <span className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <span className="block h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: allDone ? "var(--green)" : "var(--accent)" }} />
                  </span>
                  {done}/{total}
                </span>
              )
            })()}
            {tags.map((tag) => (
              <TagLink key={tag} tag={tag}>#{tag}</TagLink>
            ))}
            {task.memo && !expanded && (
              <span className="text-[10px] text-faint truncate max-w-[120px] sm:max-w-[200px]">{task.memo}</span>
            )}
          </div>

          {/* メモ（展開時） */}
          {expanded && task.memo && (
            <p className="text-xs text-dim mt-2 leading-relaxed whitespace-pre-wrap border-l-2 pl-3 py-1"
              style={{ borderColor: "var(--border)" }}>
              {task.memo}
            </p>
          )}

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

        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <Link
            href={`/tasks/${task.id}`}
            className="p-1 rounded hover:bg-[var(--faint)] text-dim"
          >
            <Pencil size={12} />
          </Link>
          <ConfirmButton
            onConfirm={() => startTransition(() => deleteTask(task.id))}
            className="p-1 rounded hover:bg-[var(--faint)]"
          />
        </div>
      </div>
    </li>
  )
}
