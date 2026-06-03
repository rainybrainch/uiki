"use client"

import { useState, useTransition } from "react"
import { updateDreamProgress, achieveDream, deleteDream } from "@/actions/dreams"
import { CheckCircle2, Circle, Trash2 } from "lucide-react"

export function DreamList({ byCategory, done, catColors, catLabels }: {
  byCategory: { cat: string; label: string; color: string; dreams: any[] }[]
  done: any[]
  catColors: Record<string, string>
  catLabels: Record<string, string>
}) {
  return (
    <div className="space-y-8">
      {byCategory.map(({ cat, label, color, dreams }) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <h3 className="text-sm font-medium" style={{ color }}>{label}</h3>
            <span className="text-xs font-mono text-faint">{dreams.length}層</span>
          </div>
          <div className="space-y-2">
            {dreams.map((d) => <DreamCard key={d.id} dream={d} color={color} />)}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} style={{ color: "#4ade80" }} />
            <h3 className="text-sm font-medium" style={{ color: "#4ade80" }}>達成済み</h3>
            <span className="text-xs font-mono text-faint">{done.length}層</span>
          </div>
          <div className="space-y-2 opacity-60">
            {done.map((d) => <DreamCard key={d.id} dream={d} color="#4ade80" achieved />)}
          </div>
        </div>
      )}
    </div>
  )
}

function DreamCard({ dream, color, achieved = false }: { dream: any; color: string; achieved?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [prog, setProg] = useState(String(dream.progress))
  const [isPending, startTransition] = useTransition()

  const handleProgress = () => {
    startTransition(async () => {
      await updateDreamProgress(dream.id, Number(prog))
      setEditing(false)
    })
  }

  const handleAchieve = () => {
    if (!confirm(`「${dream.title}」を達成しましたか？`)) return
    startTransition(() => achieveDream(dream.id))
  }

  const handleDelete = () => {
    if (!confirm(`「${dream.title}」を削除しますか？`)) return
    startTransition(() => deleteDream(dream.id))
  }

  return (
    <div className="rounded-xl p-4" style={{ background: `${color}08`, border: `1px solid ${color}22` }}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {achieved
            ? <CheckCircle2 size={16} style={{ color }} />
            : <Circle size={16} style={{ color: "var(--dim)" }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {dream.layer && <span className="text-[10px] font-mono" style={{ color: "var(--dim)" }}>L{dream.layer}</span>}
            <p className={`text-sm font-medium ${achieved ? "line-through text-dim" : ""}`}>{dream.title}</p>
          </div>
          {dream.description && <p className="text-xs text-dim mb-2 line-clamp-2">{dream.description}</p>}

          {!achieved && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--faint)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${dream.progress}%`, background: color }} />
              </div>
              {editing ? (
                <div className="flex items-center gap-1">
                  <input value={prog} onChange={(e) => setProg(e.target.value)} type="number" min="0" max="100"
                    className="w-14 text-xs px-1 py-0.5 rounded" style={{ background: "var(--faint)", border: "1px solid var(--border)", color: "white" }} />
                  <button onClick={handleProgress} disabled={isPending} className="text-xs px-2 py-0.5 rounded" style={{ background: `${color}22`, color }}>確定</button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="text-xs font-mono text-dim hover:text-white">{dream.progress}%</button>
              )}
            </div>
          )}
        </div>

        {!achieved && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleAchieve} disabled={isPending}
              className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-80"
              style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}
            >✓</button>
            <button onClick={handleDelete} disabled={isPending} className="p-1 text-faint hover:text-red-400 transition-colors">
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
