"use client"

import { useState, useTransition, useRef } from "react"
import { toggleTask, deleteTask, createTask } from "@/actions/tasks"
import { TaskCheckbox } from "./TaskCheckbox"
import { ChevronDown, ChevronRight, Pencil, Plus, Check, GitBranch } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import Link from "next/link"

type TaskNode = {
  id: string
  title: string
  memo: string | null
  priority: "HIGH" | "MEDIUM" | "LOW"
  completed: boolean
  depth: number
  dreamId: string | null
  children: TaskNode[]
}

const DEPTH_COLORS = ["#8b5cf6", "#3a6fc9", "#06b6d4", "#10b981"]
const DEPTH_LABELS = ["フロー", "Phase", "SubGoal", "タスク"]

function AddRootFlow({ projectId, dreamTitle }: { projectId?: string; dreamTitle?: string }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!value.trim()) return
    startTransition(async () => {
      await createTask({
        title: value.trim(),
        parentTaskId: undefined,
        depth: 0,
        projectId,
        priority: "MEDIUM",
      })
      setValue("")
      setDone(true)
      setTimeout(() => { setDone(false); inputRef.current?.focus() }, 900)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs w-full transition-all hover:opacity-80"
        style={{ background: "rgba(139,92,246,0.06)", border: "1px dashed rgba(139,92,246,0.25)", color: "#8b5cf6" }}
      >
        <Plus size={12} />
        {dreamTitle ? `${dreamTitle} に新しいフローを追加` : "新しいフローを追加"}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
      <GitBranch size={12} style={{ color: "#8b5cf6" }} className="shrink-0" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false) }}
        placeholder={done ? "追加しました" : "フロー名を入力（例: Flow 2: 世界版開発）"}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: done ? "#4ade80" : "var(--text)" }}
        disabled={isPending}
      />
      {value && !done && (
        <button onClick={submit} disabled={isPending}
          className="text-xs px-2 py-1 rounded shrink-0"
          style={{ background: "rgba(139,92,246,0.25)", color: "#a78bfa" }}>
          追加
        </button>
      )}
      <button onClick={() => setOpen(false)} className="text-faint hover:text-white text-xs shrink-0">×</button>
    </div>
  )
}

export function FlowView({ roots, dreamTitle, projectId }: {
  roots: TaskNode[]
  dreamTitle?: string
  projectId?: string
}) {
  if (roots.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="text-3xl mb-3 opacity-20">🌊</div>
          <p className="text-sm text-faint">フロータスクはありません</p>
          <p className="text-xs text-faint mt-1">「一括追加」でフローを貼り付けるか、下のボタンから追加</p>
        </div>
        <AddRootFlow projectId={projectId} dreamTitle={dreamTitle} />
      </div>
    )
  }

  const totalLeaves = roots.reduce((s, r) => s + countLeaves(r), 0)
  const doneLeaves  = roots.reduce((s, r) => s + countDoneLeaves(r), 0)
  const overallPct  = totalLeaves > 0 ? Math.round((doneLeaves / totalLeaves) * 100) : 0

  return (
    <div className="space-y-4">
      {dreamTitle && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} />
          <span className="text-xs font-mono text-dim">百層世界: {dreamTitle}</span>
        </div>
      )}
      {totalLeaves > 0 && (
        <div className="flex items-center gap-3 px-1 mb-1">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, background: overallPct === 100 ? "#4ade80" : "#8b5cf6" }} />
          </div>
          <span className="text-[10px] font-mono shrink-0"
            style={{ color: overallPct === 100 ? "#4ade80" : "var(--dim)" }}>
            {doneLeaves}/{totalLeaves} ({overallPct}%)
          </span>
        </div>
      )}
      {roots.map((node) => (
        <FlowNode key={node.id} node={node} projectId={projectId} />
      ))}
      <AddRootFlow projectId={projectId} dreamTitle={dreamTitle} />
    </div>
  )
}

function InlineAddTask({ parentId, depth, projectId, color }: {
  parentId: string
  depth: number
  projectId?: string
  color: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!value.trim()) return
    startTransition(async () => {
      await createTask({
        title: value.trim(),
        parentTaskId: parentId,
        depth,
        projectId,
        priority: "MEDIUM",
      })
      setValue("")
      setDone(true)
      setTimeout(() => { setDone(false); inputRef.current?.focus() }, 900)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
        style={{ color, background: `${color}10`, border: `1px dashed ${color}30` }}
      >
        <Plus size={10} /> タスクを追加
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      {done
        ? <Check size={11} style={{ color: "#4ade80" }} className="shrink-0" />
        : <Plus size={11} style={{ color }} className="shrink-0" />
      }
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false) }}
        placeholder={done ? "追加しました" : "タスク名を入力..."}
        className="flex-1 bg-transparent text-xs outline-none"
        style={{ color: done ? "#4ade80" : "var(--text)" }}
        disabled={isPending}
      />
      {value && !done && (
        <button onClick={submit} disabled={isPending}
          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${color}25`, color }}>
          追加
        </button>
      )}
      <button onClick={() => setOpen(false)} className="text-faint hover:text-white transition-colors shrink-0 text-xs">×</button>
    </div>
  )
}

function FlowNode({ node, projectId }: { node: TaskNode; projectId?: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const [, startTransition] = useTransition()

  const color = DEPTH_COLORS[Math.min(node.depth, DEPTH_COLORS.length - 1)]
  const label = DEPTH_LABELS[Math.min(node.depth, DEPTH_LABELS.length - 1)]
  const hasChildren = node.children.length > 0

  const total = countLeaves(node)
  const done = countDoneLeaves(node)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // Phase/SubGoal レベル（depth 0-2）: カード形式
  if (node.depth <= 2) {
    return (
      <div className="rounded-xl overflow-hidden" style={{
        border: `1px solid ${color}25`,
        background: `${color}06`,
        marginLeft: node.depth > 0 ? `${node.depth * 16}px` : 0,
      }}>
        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => setCollapsed((v) => !v)}
            className="p-0.5 rounded text-dim hover:text-white transition-colors shrink-0">
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
          <TaskCheckbox taskId={node.id} completed={node.completed} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                style={{ background: `${color}20`, color }}>
                {label}
              </span>
              <p className="text-sm font-medium truncate" style={{
                textDecoration: node.completed ? "line-through" : "none",
                color: node.completed ? "var(--dim)" : "var(--text)",
              }}>
                {node.title}
              </p>
            </div>
            {/* 進捗バー */}
            {hasChildren && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: pct === 100 ? "#4ade80" : "var(--dim)" }}>
                  {done}/{total}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/tasks/${node.id}`} className="p-1 rounded text-faint hover:text-white transition-colors">
              <Pencil size={11} />
            </Link>
            <ConfirmButton onConfirm={() => startTransition(() => deleteTask(node.id))} size="xs" className="p-1 rounded" />
          </div>
        </div>

        {/* 子ノード + インライン追加 */}
        {!collapsed && (
          <div className="px-3 pb-3" style={{ borderTop: `1px solid ${color}15` }}>
            {hasChildren && (
              <div className="pt-2 space-y-1.5 mb-2">
                {node.children.map((child) => (
                  <FlowNode key={child.id} node={child} projectId={projectId} />
                ))}
              </div>
            )}
            <div className={hasChildren ? "" : "pt-2"}>
              <InlineAddTask
                parentId={node.id}
                depth={node.depth + 1}
                projectId={projectId}
                color={DEPTH_COLORS[Math.min(node.depth + 1, DEPTH_COLORS.length - 1)]}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // 葉タスク（depth 3+）: コンパクト行
  return (
    <div style={{ marginLeft: `${Math.min(node.depth, 3) * 12}px` }}>
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--faint)] group transition-colors">
        <div className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
        <TaskCheckbox taskId={node.id} completed={node.completed} />
        <p className="flex-1 text-sm" style={{
          textDecoration: node.completed ? "line-through" : "none",
          color: node.completed ? "var(--dim)" : "var(--text)",
          opacity: node.completed ? 0.5 : 1,
        }}>
          {node.title}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Link href={`/tasks/${node.id}`} className="p-1 rounded text-faint hover:text-white transition-colors">
            <Pencil size={11} />
          </Link>
          <ConfirmButton onConfirm={() => startTransition(() => deleteTask(node.id))} size="xs" className="p-1 rounded" />
        </div>
      </div>
    </div>
  )
}

function countLeaves(node: TaskNode): number {
  if (node.children.length === 0) return 1
  return node.children.reduce((s, c) => s + countLeaves(c), 0)
}

function countDoneLeaves(node: TaskNode): number {
  if (node.children.length === 0) return node.completed ? 1 : 0
  return node.children.reduce((s, c) => s + countDoneLeaves(c), 0)
}
