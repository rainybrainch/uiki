"use client"

import { useEffect, useState } from "react"
import { Keyboard, X } from "lucide-react"

const SHORTCUTS = [
  {
    section: "ナビゲーション",
    items: [
      { keys: ["⌘", "K"], desc: "クイック検索を開く" },
      { keys: ["?"],       desc: "このヘルプを表示" },
      { keys: ["Esc"],     desc: "モーダル・フォームを閉じる" },
    ],
  },
  {
    section: "タスク",
    items: [
      { keys: ["Enter"],      desc: "タスクを追加（入力中）" },
      { keys: ["!"],          desc: "高優先度 (QuickAdd: !タスク名)" },
      { keys: ["~"],          desc: "低優先度 (QuickAdd: ~タスク名)" },
      { keys: ["@"],          desc: "プロジェクト割り当て (@project名)" },
      { keys: ["#"],          desc: "期限設定 (#today #明日 #6/20)" },
      { keys: ["⌘", "S"],    desc: "タスク詳細を保存" },
    ],
  },
  {
    section: "日記",
    items: [
      { keys: ["⌘", "S"],    desc: "日記を保存" },
      { keys: ["Tab"],       desc: "次のフィールドへ" },
    ],
  },
  {
    section: "検索結果内",
    items: [
      { keys: ["↑", "↓"],   desc: "結果を移動" },
      { keys: ["Enter"],     desc: "選択して移動" },
    ],
  },
]

export function KeyboardHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 入力中は発火しない
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ background: "var(--surface2)", border: "1px solid var(--border-h)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Keyboard size={15} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-medium">キーボードショートカット</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-dim hover:text-white hover:bg-[var(--faint)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ショートカット一覧 */}
        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[10px] font-mono tracking-widest text-faint uppercase mb-2">{section}</p>
              <div className="space-y-1.5">
                {items.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-dim">{desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="inline-flex items-center justify-center rounded text-[10px] font-mono px-1.5 py-0.5 min-w-[20px]"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "var(--text)",
                            boxShadow: "0 1px 0 rgba(255,255,255,0.1)",
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="text-[10px] text-faint">どこからでも <kbd className="px-1 py-0.5 rounded text-[10px] mx-0.5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>?</kbd> で表示</span>
          <button onClick={() => setOpen(false)} className="text-xs text-dim hover:text-white transition-colors">閉じる</button>
        </div>
      </div>
    </div>
  )
}
