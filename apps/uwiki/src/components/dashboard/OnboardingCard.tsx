"use client"

import { useState, useEffect } from "react"
import { X, CheckSquare, Repeat2, BookOpen, ChevronDown, ChevronUp, Zap } from "lucide-react"

const STORAGE_KEY = "uwiki-onboarding-dismissed"

const STEPS = [
  {
    icon: <Zap size={14} style={{ color: "#f59e0b" }} />,
    title: "上の入力欄でタスクを追加",
    desc: "「今日やること」を入力して Enter。! で高優先度、~ で低優先度。",
    example: "例: !プレゼン準備  ~後で読む記事",
    color: "#f59e0b",
  },
  {
    icon: <CheckSquare size={14} style={{ color: "var(--accent)" }} />,
    title: "タスクをチェックオフ",
    desc: "「タスク」カードのチェックボックスをクリックして完了。タスクページで詳細管理。",
    example: "ヒント: タスク名クリックで詳細・メモ・サブタスクを編集",
    color: "var(--accent)",
  },
  {
    icon: <Repeat2 size={14} style={{ color: "var(--green)" }} />,
    title: "習慣を毎日記録",
    desc: "「習慣」カードの丸ボタンをタップして今日の達成を記録。",
    example: "ヒント: /habits で習慣の追加・ヒートマップ確認",
    color: "var(--green)",
  },
  {
    icon: <BookOpen size={14} style={{ color: "var(--amber)" }} />,
    title: "日記を書く（週1でもOK）",
    desc: "「今日を書く →」から今日の日記ページへ。気分・タグも記録できる。",
    example: "ヒント: Cmd+S で自動保存。過去の日記はカレンダーから",
    color: "var(--amber)",
  },
]

export function OnboardingCard() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setVisible(!dismissed)
  }, [])

  if (!mounted || !visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.04)", color: "var(--faint)", border: "1px solid var(--border)" }}
      >
        <Zap size={9} /> 使い方
      </button>
    )
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  return (
    <div className="animate-fade-in-fast rounded-xl overflow-hidden"
      style={{ background: "rgba(58,111,201,0.04)", border: "1px solid rgba(58,111,201,0.2)" }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left">
          <Zap size={13} style={{ color: "var(--accent)" }} />
          <span className="text-xs font-medium">毎日の使い方 — 3ステップ</span>
          {open ? <ChevronUp size={12} className="text-dim ml-1" /> : <ChevronDown size={12} className="text-dim ml-1" />}
        </button>
        <button onClick={dismiss}
          className="p-1 rounded text-faint hover:text-white transition-colors ml-2"
          aria-label="使い方を閉じる（今後表示しない）">
          <X size={13} />
        </button>
      </div>

      {/* ステップ一覧 */}
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <div key={i} className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${step.color}18`, color: step.color }}>
                  {i + 1}
                </span>
                {step.icon}
                <span className="text-[11px] font-medium">{step.title}</span>
              </div>
              <p className="text-[10px] leading-relaxed mb-1" style={{ color: "var(--dim)" }}>
                {step.desc}
              </p>
              <p className="text-[9px] font-mono" style={{ color: "var(--faint)" }}>
                {step.example}
              </p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-1">
            <p className="text-[10px] text-faint">
              それ以外（百層世界・案件・フロービュー）は慣れてから使えばOK
            </p>
            <button onClick={dismiss}
              className="text-[10px] px-2 py-1 rounded transition-colors hover:opacity-80"
              style={{ color: "var(--dim)", border: "1px solid var(--border)" }}>
              今後表示しない
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
