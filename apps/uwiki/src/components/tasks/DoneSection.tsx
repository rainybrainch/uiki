"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { TaskList } from "./TaskList"
import { deleteAllCompleted } from "@/actions/tasks"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

export function DoneSection({
  tasks,
  count,
  projectId,
}: {
  tasks: any[]
  count: number
  projectId?: string
}) {
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  return (
    <section className="mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left group"
        >
          {open
            ? <ChevronDown size={12} className="text-faint" />
            : <ChevronRight size={12} className="text-faint" />
          }
          <span className="text-xs text-faint group-hover:text-dim transition-colors">
            完了 — {count}件
          </span>
        </button>

        {count > 0 && (
          <ConfirmButton
            onConfirm={() => startTransition(() => deleteAllCompleted(projectId))}
            label="すべて削除"
            confirmLabel="完了タスクを削除"
            size="xs"
            className="text-faint hover:text-red-400 transition-colors flex items-center gap-1"
          />
        )}
      </div>

      {open && <TaskList tasks={tasks} dimmed />}
    </section>
  )
}
