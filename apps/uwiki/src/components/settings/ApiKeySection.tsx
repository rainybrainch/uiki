"use client"

import { useState, useTransition } from "react"
import { generateApiKey } from "@/actions/settings"
import { Copy, RefreshCw, Check } from "lucide-react"

export function ApiKeySection({ currentKey }: { currentKey: string | null }) {
  const [key, setKey] = useState(currentKey)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const generate = () => {
    startTransition(async () => {
      const result = await generateApiKey()
      setKey(result.key)
    })
  }

  const copy = () => {
    if (!key) return
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="surface rounded-xl p-4 space-y-3">
      {key ? (
        <div>
          <p className="text-xs text-dim mb-2">現在のAPIキー</p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-[11px] font-mono px-3 py-2 rounded-lg truncate"
              style={{ background: "rgba(255,255,255,0.04)", color: "var(--accent)" }}
            >
              {key}
            </code>
            <button
              onClick={copy}
              className="p-2 rounded-lg hover:bg-[var(--faint)] transition-colors text-dim hover:text-white"
            >
              {copied ? <Check size={14} style={{ color: "var(--green)" }} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-faint">APIキーが未設定です</p>
      )}

      <button className="btn-primary text-xs flex items-center gap-1.5" onClick={generate} disabled={pending}>
        <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
        {key ? "再生成" : "APIキーを生成"}
      </button>

      <div className="text-[10px] text-faint space-y-1">
        <p>他サービスから以下のヘッダーで認証します：</p>
        <code className="block px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
          Authorization: Bearer {"<APIキー>"}
        </code>
        <p className="mt-1">エンドポイント: <code>GET/POST /api/tasks</code>　<code>PATCH/DELETE /api/tasks/[id]</code></p>
      </div>
    </div>
  )
}
