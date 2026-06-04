"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

type Props = {
  onPolish: () => Promise<string>
  onResult: (text: string) => void
  label?: string
  size?: "xs" | "sm"
}

export function AiPolishButton({ onPolish, onResult, label = "AI整形", size = "xs" }: Props) {
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const result = await onPolish()
      if (result) onResult(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className={`flex items-center gap-1 transition-opacity hover:opacity-80 disabled:opacity-40 ${size === "xs" ? "text-[10px] px-2 py-0.5 rounded-md" : "text-xs px-2.5 py-1 rounded-lg"}`}
      style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
    >
      {loading
        ? <Loader2 size={10} className="animate-spin" />
        : <Sparkles size={10} />
      }
      {loading ? "生成中..." : label}
    </button>
  )
}
