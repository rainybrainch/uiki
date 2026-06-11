"use client"

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import { format, differenceInCalendarDays, parseISO, startOfDay } from "date-fns"
import { useRouter } from "next/navigation"
import { updateTask, deleteTask, toggleTask, createSubTask, toggleSubTask, deleteSubTask } from "@/actions/tasks"
import type { Priority, Recurrence } from "@/actions/tasks"
import { assignTaskToProject } from "@/actions/projects"
import { SubTaskList } from "./SubTaskList"
import { ArrowLeft, Trash2, RotateCcw, Calendar, Tag, FolderOpen, CheckCircle2, Circle, Check, Clock, ChevronRight, GitBranch, Layers } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import Link from "next/link"
import clsx from "clsx"

type SubTask = { id: string; title: string; completed: boolean; order: number }
type Project = { id: string; name: string; color: string }
type Dream = { id: string; title: string; layer: number }
type Task = {
  id: string; title: string; memo: string | null; priority: "HIGH" | "MEDIUM" | "LOW"
  dueDate: Date | null; column: string; completed: boolean; tags: string | null
  recurrence: string | null; projectId: string | null; dreamId?: string | null
  createdAt: Date
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

export function TaskDetailClient({
  task,
  projects,
  ancestors = [],
  dreams = [],
}: {
  task: Task
  projects: Project[]
  ancestors?: { id: string; title: string }[]
  dreams?: Dream[]
}) {
  const router = useRouter()
  const [title, setTitle]       = useState(task.title)
  const [memo, setMemo]         = useState(task.memo ?? "")
  const [priority, setPriority] = useState<Priority>(task.priority as Priority)
  const [dueDate, setDueDate]   = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "")
  const [tags, setTags]         = useState(task.tags ?? "")
  const [recurrence, setRecurrence] = useState<Recurrence | "">(task.recurrence as Recurrence ?? "")
  const [projectId, setProjectId]   = useState(task.projectId ?? "")
  const [dreamId, setDreamId]       = useState(task.dreamId ?? "")
  const [completed, setCompleted]   = useState(task.completed)
  const [dirty, setDirty]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [pending, startTransition]  = useTransition()
  const autoSaveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 最新の状態を参照するためのref（useCallback依存配列の問題を回避）
  const stateRef = useRef({ title, memo, priority, dueDate, tags, recurrence, projectId, dreamId })
  stateRef.current = { title, memo, priority, dueDate, tags, recurrence, projectId, dreamId }

  const save = useCallback(async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    const s = stateRef.current
    setSaving(true)
    try {
      await updateTask(task.id, {
        title: s.title.trim() || task.title,
        memo: s.memo || undefined,
        priority: s.priority,
        dueDate: s.dueDate || null,
        tags: s.tags || undefined,
        recurrence: (s.recurrence as Recurrence) || null,
        dreamId: s.dreamId || null,
      })
      if (s.projectId !== (task.projectId ?? "")) {
        await assignTaskToProject(task.id, s.projectId || null)
      }
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [task.id, task.title, task.projectId])

  const markDirty = useCallback(() => {
    setDirty(true)
    setSaved(false)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(), 1500)
  }, [save])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [save])

  const toggleDone = () => {
    const next = !completed
    setCompleted(next)
    startTransition(() => toggleTask(task.id, next))
  }

  const remove = () => {
    startTransition(async () => {
      await deleteTask(task.id)
      router.push("/tasks")
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-8 animate-fade-in">
      {/* 戻るボタン */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-dim hover:text-white transition-colors">
          <ArrowLeft size={14} /> 戻る
        </button>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--green)" }}>
              <Check size={11} /> 保存済み
            </span>
          )}
          {saving && <span className="text-xs text-dim">保存中...</span>}
          {dirty && !saving && (
            <button className="btn-primary text-xs" onClick={save} disabled={saving}>
              保存
            </button>
          )}
          <ConfirmButton onConfirm={remove} disabled={pending} className="p-2 rounded-lg hover:bg-[var(--faint)]" />
        </div>
      </div>

      {/* フロー階層パンくず */}
      {ancestors.length > 0 && (
        <nav className="flex items-center gap-1 mb-6 flex-wrap" aria-label="パンくず">
          <Link href="/tasks?view=flow" className="flex items-center gap-1 text-[10px] text-dim hover:text-white transition-colors shrink-0">
            <GitBranch size={10} />
            <span>フロー</span>
          </Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex items-center gap-1 shrink-0">
              <ChevronRight size={9} className="text-faint" />
              <Link href={`/tasks/${a.id}`}
                className="text-[10px] text-dim hover:text-white transition-colors max-w-[120px] truncate block"
                title={a.title}>
                {a.title}
              </Link>
            </span>
          ))}
          <span className="flex items-center gap-1 shrink-0">
            <ChevronRight size={9} className="text-faint" />
            <span className="text-[10px] text-white truncate max-w-[120px]">{task.title}</span>
          </span>
        </nav>
      )}

      {/* 完了チェック + タイトル */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={toggleDone}
          aria-label={completed ? "タスクを未完了にする" : "タスクを完了にする"}
          aria-pressed={completed}
          className="mt-1 shrink-0 transition-colors"
        >
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
      <div className="surface rounded-xl p-4 md:p-5 space-y-4 mb-6">

        {/* 優先度 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <span className="text-xs text-dim sm:w-20 shrink-0">優先度</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5 text-dim sm:w-20 shrink-0">
            <Calendar size={12} />
            <span className="text-xs">締切日</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input-field text-xs sm:max-w-[180px]"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); markDirty() }}
            />
            {dueDate && !completed && (() => {
              const days = differenceInCalendarDays(startOfDay(parseISO(dueDate)), startOfDay(new Date()))
              const label = days < 0 ? `⚠ ${Math.abs(days)}日超過` : days === 0 ? "今日" : days === 1 ? "明日" : `${days}日後`
              const color = days < 0 ? "var(--red)" : days === 0 ? "var(--amber)" : days <= 3 ? "#f59e0b" : "var(--dim)"
              return (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color, background: `${color}18` }}>
                  {label}
                </span>
              )
            })()}
          </div>
        </div>

        {/* 繰り返し */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5 text-dim sm:w-20 shrink-0">
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
          <div className="flex items-center gap-1.5 text-dim sm:w-20 shrink-0">
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
          <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
            <div className="flex items-center gap-1.5 text-dim sm:w-20 sm:mt-1 shrink-0">
              <FolderOpen size={12} />
              <span className="text-xs">プロジェクト</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => { setProjectId(""); markDirty() }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                style={{
                  background: !projectId ? "rgba(255,255,255,0.08)" : "transparent",
                  borderColor: !projectId ? "rgba(255,255,255,0.3)" : "var(--border)",
                  color: !projectId ? "white" : "var(--dim)",
                }}>
                なし
              </button>
              {projects.map((p) => (
                <button key={p.id} type="button" onClick={() => { setProjectId(p.id); markDirty() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: projectId === p.id ? `${p.color}18` : "transparent",
                    borderColor: projectId === p.id ? p.color : "var(--border)",
                    color: projectId === p.id ? p.color : "var(--dim)",
                  }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* 百層世界リンク */}
        {dreams.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:w-20 sm:mt-1 shrink-0" style={{ color: "#8b5cf6" }}>
              <Layers size={12} />
              <span className="text-xs">百層世界</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => { setDreamId(""); markDirty() }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                style={{
                  background: !dreamId ? "rgba(139,92,246,0.15)" : "transparent",
                  borderColor: !dreamId ? "rgba(139,92,246,0.4)" : "var(--border)",
                  color: !dreamId ? "#8b5cf6" : "var(--dim)",
                }}>
                なし
              </button>
              {dreams.map((d) => (
                <button key={d.id} type="button" onClick={() => { setDreamId(d.id); markDirty() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                  style={{
                    background: dreamId === d.id ? "rgba(139,92,246,0.15)" : "transparent",
                    borderColor: dreamId === d.id ? "rgba(139,92,246,0.4)" : "var(--border)",
                    color: dreamId === d.id ? "#8b5cf6" : "var(--dim)",
                  }}>
                  <span className="text-[9px] font-mono opacity-60">No.{d.layer}</span>
                  <span className="truncate max-w-[120px]">{d.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* メモ */}
      <div className="surface rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-dim">メモ</p>
          {memo.length > 0 && (
            <span className="text-[10px] font-mono tabular-nums"
              style={{ color: memo.length > 500 ? "var(--amber)" : "var(--faint)" }}>
              {memo.length}字
            </span>
          )}
        </div>
        <textarea
          className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none placeholder:text-faint"
          style={{ minHeight: 120, overflow: "hidden" }}
          placeholder="メモを入力..."
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value)
            markDirty()
            // auto-resize
            e.target.style.height = "auto"
            e.target.style.height = e.target.scrollHeight + "px"
          }}
          onFocus={(e) => {
            e.target.style.height = "auto"
            e.target.style.height = e.target.scrollHeight + "px"
          }}
        />
      </div>

      {/* サブタスク */}
      <div className="surface rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs text-dim">サブタスク</p>
          {task.subtasks.length > 0 && (() => {
            const done = task.subtasks.filter((s) => s.completed).length
            const allDone = done === task.subtasks.length
            return (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: allDone ? "rgba(74,222,128,0.1)" : "rgba(58,111,201,0.1)",
                  color: allDone ? "var(--green)" : "var(--accent)",
                }}>
                {done}/{task.subtasks.length}
              </span>
            )
          })()}
        </div>
        {task.subtasks.length > 0 && (() => {
          const done = task.subtasks.filter((s) => s.completed).length
          const pct = Math.round((done / task.subtasks.length) * 100)
          return (
            <div className="mb-3 rounded-full overflow-hidden" style={{ height: 3, background: "var(--faint)" }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? "var(--green)" : "var(--accent)",
                }} />
            </div>
          )
        })()}
        <SubTaskList taskId={task.id} subtasks={task.subtasks} />
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <span className="flex items-center gap-1 text-[10px] text-faint">
          <Clock size={9} />
          {format(new Date(task.createdAt), "yyyy/MM/dd HH:mm")}
        </span>
        <span className="text-faint text-[10px]">·</span>
        <span className="text-[10px] text-faint">⌘S / Ctrl+S で保存 · 自動保存あり</span>
      </div>
    </div>
  )
}
