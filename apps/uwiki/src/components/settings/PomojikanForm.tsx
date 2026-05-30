"use client"

import { useState, useTransition } from "react"
import { savePomojikanSettings } from "@/actions/settings"
import { Check, AlertCircle, Loader2, ExternalLink } from "lucide-react"

export function PomojikanForm({
  currentUrl, active,
}: {
  currentUrl: string | null
  active: boolean
}) {
  const [url, setUrl] = useState(currentUrl ?? "")
  const [enabled, setEnabled] = useState(active)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      const result = await savePomojikanSettings({ url: url || null, active: enabled })
      setStatus({ ok: result.ok, message: result.ok ? "保存しました" : (result.error ?? "エラー") })
    })
  }

  return (
    <div className="surface rounded-xl p-4 space-y-4">
      {/* 有効化トグル */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm">ぽもじかん連携を有効にする</span>
        <button
          onClick={() => setEnabled(!enabled)}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ background: enabled ? "var(--accent-2)" : "var(--faint)" }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
            style={{ left: enabled ? "calc(100% - 18px)" : "2px" }}
          />
        </button>
      </label>

      {/* URL入力 */}
      <div>
        <label className="text-xs text-dim mb-1.5 block">ぽもじかん URL</label>
        <input
          className="input-field text-sm"
          placeholder="https://rainybrainch.github.io/pomojikan/"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setStatus(null) }}
          disabled={!enabled}
        />
        <p className="text-[10px] text-faint mt-1.5">
          ぽもじかんのURLを入力すると、タスクカードにタイマー起動ボタンが表示されます。
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-xs text-dim hover:text-accent transition-colors"
          onClick={() => window.open("https://rainybrainch.github.io/pomojikan/", "_blank")}
        >
          <ExternalLink size={11} /> ぽもじかんを開く
        </button>
        <button
          className="btn-primary text-xs"
          onClick={save}
          disabled={pending}
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : "保存"}
        </button>
      </div>

      {status && (
        <div
          className="flex items-center gap-2 text-xs animate-fade-in-fast"
          style={{ color: status.ok ? "var(--green)" : "var(--red)" }}
        >
          {status.ok ? <Check size={12} /> : <AlertCircle size={12} />}
          {status.message}
        </div>
      )}
    </div>
  )
}
