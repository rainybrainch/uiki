"use client"

import { useState } from "react"
import { Sparkles, Loader2, Check, X } from "lucide-react"

export function GeminiSection({ keyCount }: { keyCount: number }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; result?: string; error?: string } | null>(null)

  const test = async () => {
    setTesting(true)
    setResult(null)
    const res = await fetch("/api/ai-test")
    const data = await res.json()
    setResult(data)
    setTesting(false)
  }

  return (
    <div className="surface rounded-xl p-4 space-y-3">
      {/* キー状態 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Gemini 2.0 Flash</p>
          <p className="text-xs text-dim mt-0.5">5キーローテーション・レート制限自動回避</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full"
          style={{
            background: keyCount > 0 ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
            color: keyCount > 0 ? "var(--green)" : "var(--red)",
            border: `1px solid ${keyCount > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
          }}>
          {keyCount > 0 ? `${keyCount}キー有効` : "未設定"}
        </span>
      </div>

      {/* キーの内訳 */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: i < keyCount ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${i < keyCount ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
              color: i < keyCount ? "#a78bfa" : "var(--faint)",
            }}>
            KEY {i + 1} {i < keyCount ? "✓" : "—"}
          </div>
        ))}
      </div>

      {/* 利用箇所 */}
      <div className="text-[10px] text-dim space-y-0.5 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <p className="font-mono tracking-wider text-faint mb-1.5">AI 利用箇所</p>
        {[
          "メール自動分類・優先度判定",
          "テキスト整形（日記・ライブラリ・百層世界）",
          "読雨への投稿・ブクログ用レビュー生成",
          "コメント人格の自動生成（YouTube URL から）",
          "記録 → 人格エンリッチ（ライブラリ完了・読雨投稿）",
        ].map((item) => (
          <div key={item} className="flex items-center gap-1.5">
            <Sparkles size={9} style={{ color: "#a78bfa", flexShrink: 0 }} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* テストボタン */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={test}
          disabled={testing || keyCount === 0}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          {testing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          {testing ? "テスト中..." : "接続テスト"}
        </button>
        {result && (
          <div className="flex items-center gap-1.5 text-xs animate-fade-in-fast"
            style={{ color: result.ok ? "var(--green)" : "var(--red)" }}>
            {result.ok ? <Check size={11} /> : <X size={11} />}
            {result.ok ? `「${result.result}」` : result.error}
          </div>
        )}
      </div>
    </div>
  )
}
