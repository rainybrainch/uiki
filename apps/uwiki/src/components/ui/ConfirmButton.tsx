"use client"

import { useState, useEffect, useRef } from "react"
import { Trash2, AlertTriangle } from "lucide-react"

/**
 * 削除・破壊的操作用のインライン確認ボタン。
 * 最初のクリックで「本当に？」モードに入り、
 * 確認クリックで onConfirm を実行。キャンセル or 2秒後に自動リセット。
 */
export function ConfirmButton({
  onConfirm,
  disabled,
  label = "削除",
  confirmLabel = "削除する",
  icon,
  size = "sm",
  className = "",
}: {
  onConfirm: () => void
  disabled?: boolean
  label?: string
  confirmLabel?: string
  icon?: React.ReactNode
  size?: "xs" | "sm"
  className?: string
}) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(true)
    timerRef.current = setTimeout(() => setConfirming(false), 3000)
  }

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
    onConfirm()
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const px = size === "xs" ? "px-1.5 py-0.5" : "px-2 py-1"
  const textSize = size === "xs" ? "text-[10px]" : "text-xs"

  if (confirming) {
    return (
      <div className={`flex items-center gap-1 animate-fade-in-fast ${className}`} onClick={(e) => e.stopPropagation()}>
        <AlertTriangle size={10} style={{ color: "var(--red)" }} className="shrink-0" />
        <button
          onClick={handleConfirm}
          disabled={disabled}
          className={`${px} ${textSize} rounded font-medium transition-colors`}
          style={{ background: "rgba(248,113,113,0.15)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)" }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={handleCancel}
          className={`${px} ${textSize} rounded transition-colors text-dim hover:text-white`}
          style={{ border: "1px solid var(--border)" }}
        >
          戻す
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startConfirm}
      disabled={disabled}
      aria-label={label}
      className={`flex items-center gap-1 transition-colors text-faint hover:text-red-400 ${className}`}
    >
      {icon ?? <Trash2 size={size === "xs" ? 10 : 12} />}
      {label !== "削除" && <span className={textSize}>{label}</span>}
    </button>
  )
}
