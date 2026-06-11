"use client"

import { useState, useTransition } from "react"
import { updateDreamProgress, achieveDream, deleteDream, updateDream } from "@/actions/dreams"
import { polishText } from "@/actions/ai-write"
import { useRouter } from "next/navigation"
import { CheckCircle2, Pencil, Check, X } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"
import { AiPolishButton } from "@/components/ui/AiPolishButton"
import type { Dream } from "@uwiki/database"

type EditableField = "definition" | "vision" | "vow" | "constraints" | "period" | "kpi" | "connections" | "title"

interface Props {
  id: string
  progress: number
  achieved: boolean
  catColor: string
  dream: Pick<Dream, "id" | "title" | "definition" | "vision" | "vow" | "constraints" | "period" | "kpi" | "connections">
}

const FIELD_META: { key: EditableField; label: string; icon: string; multiline?: boolean }[] = [
  { key: "definition",  label: "定義",         icon: "①", multiline: true },
  { key: "vision",      label: "目的/ビジョン", icon: "②", multiline: true },
  { key: "vow",         label: "誓約",         icon: "③", multiline: true },
  { key: "constraints", label: "制約",         icon: "④", multiline: true },
  { key: "period",      label: "期間",         icon: "⑤" },
  { key: "kpi",         label: "評価軸/KPI",   icon: "⑥", multiline: true },
  { key: "connections", label: "相互関連性（カンマ区切り）", icon: "⑦" },
]

function getPhaseLabel(pct: number): string {
  if (pct === 0)   return "未着手"
  if (pct <= 20)   return "萌芽期"
  if (pct <= 50)   return "成長期"
  if (pct <= 80)   return "実行期"
  if (pct < 100)   return "完成期"
  return "達成"
}

export function DreamDetailClient({ id, progress: initialProgress, achieved, catColor, dream }: Props) {
  const [progress, setProgress] = useState(initialProgress)
  const [isPending, startTransition] = useTransition()
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [fieldVal, setFieldVal] = useState("")
  const router = useRouter()

  const handleProgressChange = (val: number) => {
    setProgress(val)
    startTransition(async () => {
      await updateDreamProgress(id, val)
    })
  }

  const handleAchieve = () => {
    startTransition(async () => {
      await achieveDream(id)
      router.push("/dreams")
    })
  }

  const handleDelete = async () => {
    await deleteDream(id)
    router.push("/dreams")
  }

  const startEdit = (key: EditableField) => {
    setEditingField(key)
    setFieldVal((dream[key] as string | null) ?? "")
  }

  const saveField = () => {
    if (!editingField) return
    const val = fieldVal.trim()
    startTransition(async () => {
      await updateDream(id, { [editingField]: val || undefined })
      setEditingField(null)
      router.refresh()
    })
  }

  const cancelEdit = () => setEditingField(null)

  const filledFields = FIELD_META.filter(({ key }) => {
    const v = (dream[key] as string | null) ?? ""
    return v.trim().length > 0
  }).length

  return (
    <div className="space-y-4">
      {/* 進捗スライダー */}
      {!achieved && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-dim">進捗</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  background: filledFields === FIELD_META.length ? `${catColor}18` : "rgba(255,255,255,0.04)",
                  color: filledFields === FIELD_META.length ? catColor : "var(--faint)",
                  border: `1px solid ${filledFields === FIELD_META.length ? catColor + "30" : "var(--border)"}`,
                }}>
                {filledFields}/{FIELD_META.length} フィールド
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: catColor, background: `${catColor}12`, opacity: 0.85 }}>
                {getPhaseLabel(progress)}
              </span>
              <span className="text-sm font-mono font-light" style={{ color: catColor }}>{progress}%</span>
            </div>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${catColor}99, ${catColor})` }} />
            {[20, 50, 80].map((t) => (
              <div key={t} className="absolute inset-y-0 w-px" style={{ left: `${t}%`, background: "rgba(255,255,255,0.18)", zIndex: 1 }} />
            ))}
          </div>
          <input
            type="range" min="0" max="100" step="5" value={progress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            disabled={isPending}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: catColor }}
          />
        </div>
      )}

      {/* アクション */}
      <div className="flex items-center gap-2 flex-wrap">
        {!achieved && (
          <button onClick={handleAchieve} disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "rgba(74,222,128,0.1)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.25)" }}>
            <CheckCircle2 size={12} />達成にする
          </button>
        )}
        <ConfirmButton onConfirm={handleDelete} label="削除" confirmLabel="本当に削除"
          className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80" />
      </div>

      {/* フィールド編集 */}
      <div className="pt-2 space-y-3">
        {FIELD_META.map(({ key, label, icon, multiline }) => {
          const currentVal = (dream[key] as string | null) ?? ""
          const isEditing = editingField === key
          return (
            <div key={key} className="rounded-xl p-4 group"
              style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isEditing ? catColor + "50" : "var(--border)"}`, transition: "border-color 0.15s" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-mono tracking-wider flex items-center gap-1.5"
                  style={{ color: catColor, opacity: 0.8 }}>
                  <span>{icon}</span>{label}
                </p>
                {!isEditing && (
                  <button onClick={() => startEdit(key)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[rgba(255,255,255,0.06)]"
                    title="編集">
                    <Pencil size={11} style={{ color: "var(--dim)" }} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {multiline ? (
                    <textarea
                      value={fieldVal}
                      onChange={(e) => setFieldVal(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full text-sm px-3 py-2 rounded-lg resize-none outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text)", lineHeight: 1.7 }}
                      onKeyDown={(e) => { if (e.key === "Escape") cancelEdit() }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={fieldVal}
                      onChange={(e) => setFieldVal(e.target.value)}
                      autoFocus
                      className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text)" }}
                      onKeyDown={(e) => { if (e.key === "Enter") saveField(); if (e.key === "Escape") cancelEdit() }}
                    />
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={saveField} disabled={isPending}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}35` }}>
                      <Check size={11} />保存
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-dim hover:text-white"
                      style={{ border: "1px solid var(--border)" }}>
                      <X size={11} />キャンセル
                    </button>
                    {fieldVal.trim() && (
                      <AiPolishButton
                        onPolish={() => polishText(fieldVal, `百層世界「${dream.title}」の${FIELD_META.find((f) => f.key === editingField)?.label ?? ""}フィールド`)}
                        onResult={(text) => setFieldVal(text)}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div onClick={() => startEdit(key)} className="cursor-text">
                  {currentVal ? (
                    key === "connections" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentVal.split(",").map((s) => s.trim()).filter(Boolean).map((name) => (
                          <span key={name} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{currentVal}</p>
                    )
                  ) : (
                    <p className="text-xs italic" style={{ color: "var(--faint)" }}>クリックして入力...</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
