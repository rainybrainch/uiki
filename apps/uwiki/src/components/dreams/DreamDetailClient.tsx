"use client"

import { useState, useTransition } from "react"
import { updateDreamProgress, achieveDream, deleteDream } from "@/actions/dreams"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { ConfirmButton } from "@/components/ui/ConfirmButton"

interface Props {
  id: string
  progress: number
  achieved: boolean
  catColor: string
}

export function DreamDetailClient({ id, progress: initialProgress, achieved, catColor }: Props) {
  const [progress, setProgress] = useState(initialProgress)
  const [isPending, startTransition] = useTransition()
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

  return (
    <div className="space-y-4">
      {/* 進捗スライダー */}
      {!achieved && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dim">進捗</span>
            <span className="text-sm font-mono font-light" style={{ color: catColor }}>
              {progress}%
            </span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden mb-2"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-all"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${catColor}99, ${catColor})` }} />
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
          <button
            onClick={handleAchieve}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ background: "rgba(74,222,128,0.1)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.25)" }}>
            <CheckCircle2 size={12} />
            達成にする
          </button>
        )}
        <ConfirmButton
          onConfirm={handleDelete}
          label="削除"
          confirmLabel="本当に削除"
          className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
        />
      </div>
    </div>
  )
}
