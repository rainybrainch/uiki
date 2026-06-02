"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { updateTask, deleteTask, toggleTask, createSubTask, toggleSubTask, deleteSubTask } from "@/actions/tasks"
import type { Priority, Recurrence } from "@/actions/tasks"
import { assignTaskToProject } from "@/actions/projects"
import { SubTaskList } from "./SubTaskList"
import { ArrowLeft, Trash2, RotateCcw, Calendar, Tag, FolderOpen, CheckCircle2, Circle } from "lucide-react"
import Link from "next/link"
import clsx from "clsx"

type SubTask = { id: string; title: string; completed: boolean; order: number }
type Project = { id: string; name: string; color: string }
type Task = {
  id: string; title: string; memo: string | null; priority: "HIGH" | "MEDIUM" | "LOW"
  dueDate: Date | null; column: string; completed: boolean; tags: string | null
  recurrence: string | null; projectId: string | null
  subtasks: SubTask[]
  project: { id: string; name: string; color: string } | null
}

const PRIORITY_OPTS = [
  { value: "HIGH",   label: "高", color: "var(--red)" },
  { value: "MEDIUM", label: "中", color: "var(--accent)" },
  { value: "LOW",    label: "低", color: "var(--dim)" },
]
const REC_OPTS: { value: Recurrence | ""; label: string }[] = [
  { value: "",        label: "なし" },
  { value: "daily",   label: "毎日" },
  { value: "weekly",  label: "毎週" },
  { value: "monthly", label: "毎月" },
]

export function TaskDetailClient({ task, projects }: { task: Task; projects: Project[] }) {
  const router = useRouter()
  const [title, setTitle]       = useState(task.title)
  const [memo, setMemo]         = useState(task.memo ?? "")
  const [priority, setPriority] = useState<Priority>(task.priority as Priority)
  const [dueDate, setDueDate]   = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "")
  const [tags, setTags]         = useState(task.tags ?? "")
  const [recurrence, setRecurrence] = useState<Recurrence | "">(task.recurrence as Recurrence ?? "")
  const [projectId, setProjectId]   = useState(task.projectId ?? "")
  const [completed, setCompleted]   = useState(task.completed)
  const [dirty, setDirty]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [pending, startTransition]  = useTransition()

  const markDirty = () => setDirty(true)

  const save = async () => {
    setSaving(true)
    try {
      await updateTask(task.id, {
        title: title.trim() || task.title,
        memo: memo || undefined,
        priority,
        dueDate: dueDate || null,
        tags: tags || undefined,
        recurrence: (recurrence as Recurrence) || null,
      })
      if (projectId !== (task.projectId ?? "")) {
        await assignTaskToProject(task.id, projectId || null)
      }
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleDone = () => {
    const next = !completed
    setCompleted(next)
    startTransition(() => toggleTask(task.id, next))
  }

  const remove = () => {
    if (confirm("このタスクを削除しますか？")) {
      startTransition(async () => {
        await deleteTask(task.id)
        router.push("/tasks")
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
      {/* 戻るボタン */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/tasks" className="flex items-center gap-2 text-sm text-dim hover:text-white transition-colors">
          <ArrowLeft size={14} /> タスク一覧
        </Link>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              className="btn-primary text-xs"
              onClick={save}
              disabled={saving}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          )}
          <button onClick={remove} className="p-2 rounded-lg text-dim hover:text-red-400 hover:bg-[var(--faint)] transition-all">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* 完了チェック + タイトル */}
      <div className="flex items-start gap-4 mb-8">
        <button onClick={toggleDone} className="mt-1 shrink-0 transition-colors">
          {completed
            ? <CheckCircle2 size={22} style={{ color: "var(--accent)" }} />
            : <Circle size={22} className="text-dim" />
          }
        </button>
        <input
          className={clsx(
            "flex-1 bg-transparent outline-none text-2xl font-serif font-light",
            "placeholder:text-dim leading-snug",
            completed && "line-through text-dim"
          )}
          value={title}
          onChange={(e) => { setTitle(e.target.value); markDirty() }}
          placeholder="タスクタイトル"
        />
      </div>

      {/* メタデータ */}
      <div className="surface rounded-xl p-5 space-y-4 mb-6">

        {/* 優先度 */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-dim w-20 shrink-0">優先度</span>
          <div className="flex gap-2">
            {PRIORITY_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPriority(opt.value as Priority); markDirty() }}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs border transition-all",
                  priority === opt.value
                    ? "text-white border-transparent"
                    : "text-dim border-[var(--border)] hover:border-[var(--accent)]"
                )}
                style={priority === opt.value ? { background: opt.color, borderColor: opt.color } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 締切日 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-dim w-20 shrink-0">
            <Calendar size={12} />
            <span className="text-xs">締切日</span>
          </div>
          <input
            type="date"
            className="input-field text-xs max-w-[180px]"
            value={dueDate}
            onChange={(e) => { setDueDate(e.target.value); markDirty() }}
          />
        </div>

        {/* 繰り返し */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-dim w-20 shrink-0">
            <RotateCcw size={12} />
            <span className="text-xs">繰り返し</span>
          </div>
          <div className="flex gap-2">
            {REC_OPTS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setRecurrence(opt.value); markDirty() }}
                className={clsx(
                  "px-3 py-1 rounded-full text-xs border transition-all",
                  recurrence === opt.value
                    ? "bg-[var(--accent-2)] text-white border-[var(--accent)]"
                    : "text-dim border-[var(--border)] hover:border-[var(--accent)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* タグ */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-dim w-20 shrink-0">
            <Tag size={12} />
            <span className="text-xs">タグ</span>
          </div>
          <input
            className="input-field text-xs flex-1"
            placeholder="仕事, 個人"
            value={tags}
            onChange={(e) => { setTags(e.target.value); markDirty() }}
          />
        </div>

        {/* プロジェクト */}
        {projects.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-dim w-20 shrink-0">
              <FolderOpen size={12} />
              <span className="text-xs">プロジェクト</span>
            </div>
            <select
              className="input-field text-xs max-w-[200px]"
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); markDirty() }}
            >
              <option value="">なし</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* メモ */}
      <div className="surface rounded-xl p-5 mb-6">
        <p className="text-xs text-dim mb-3">メモ</p>
        <textarea
          className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none placeholder:text-faint"
          rows={6}
          placeholder="メモを入力..."
          value={memo}
          onChange={(e) => { setMemo(e.target.value); markDirty() }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save() }
          }}
        />
      </div>

      {/* サブタスク */}
      <div className="surface rounded-xl p-5">
        <p className="text-xs text-dim mb-3">サブタスク</p>
        <SubTaskList taskId={task.id} subtasks={task.subtasks} />
      </div>

      <p className="text-[10px] text-faint text-center mt-6">⌘S で保存</p>
    </div>
  )
}
