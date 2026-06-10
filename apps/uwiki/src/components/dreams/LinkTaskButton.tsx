"use client"

import { useState, useTransition } from "react"
import { linkTaskToDream, unlinkTaskFromDream } from "@/actions/tasks"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

type AvailableTask = { id: string; title: string }

export function LinkTaskButton({ dreamId, availableTasks }: { dreamId: string; availableTasks: AvailableTask[] }) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLink = () => {
    if (!selectedId) return
    startTransition(async () => {
      await linkTaskToDream(selectedId, dreamId)
      setSelectedId("")
      setOpen(false)
      router.refresh()
    })
  }

  if (availableTasks.length === 0) return null

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: "rgba(58,111,201,0.08)", color: "var(--dim)", border: "1px solid var(--border)" }}
        >
          <Plus size={11} />タスクをリンク
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none min-w-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="">タスクを選択...</option>
            {availableTasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={!selectedId || isPending}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ background: "rgba(58,111,201,0.15)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.3)" }}
          >
            リンク
          </button>
          <button onClick={() => { setOpen(false); setSelectedId("") }}
            className="p-1.5 rounded-lg text-dim hover:text-white transition-colors">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export function UnlinkTaskButton({ taskId, dreamId }: { taskId: string; dreamId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleUnlink = () => {
    startTransition(async () => {
      await unlinkTaskFromDream(taskId, dreamId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleUnlink}
      disabled={isPending}
      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-faint hover:text-red-400 shrink-0"
      title="リンクを解除"
    >
      <X size={10} />
    </button>
  )
}
