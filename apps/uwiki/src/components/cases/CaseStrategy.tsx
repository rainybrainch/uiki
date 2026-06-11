"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Star, Clock, Target, Zap } from "lucide-react"

const SKILLS = ["HP・LP制作（HTML/CSS/React/Next.js）", "AI導入支援（Claude API・ChatGPT）", "ノーコード（Dify・自動化）", "業務効率化ワークフロー構築"]

const CRITERIA = [
  { label: "時給換算", check: "1,500円以上", note: "（報酬 ÷ 想定時間で判定）" },
  { label: "完了期待値", check: "1〜2週間以内", note: "（長期は要交渉）" },
  { label: "スコープ", check: "要件が明確", note: "（曖昧なら確認してから提案）" },
  { label: "得意領域", check: "Web / AI / 自動化", note: "（デザインのみ・動画は避ける）" },
]

export function CaseStrategy() {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center gap-2">
          <Target size={13} className="text-dim" />
          <span className="text-xs font-mono text-dim tracking-wider">軸1 — 運営方針</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(201,168,76,0.12)", color: "var(--amber)" }}>
            CW主軸
          </span>
        </div>
        {open ? <ChevronUp size={13} className="text-dim" /> : <ChevronDown size={13} className="text-dim" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* 数値目標 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-[10px] text-dim mb-1">月収目標</p>
              <p className="text-base font-serif font-light" style={{ color: "var(--amber)" }}>20万円</p>
            </div>
            <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] text-dim mb-1">時給下限</p>
              <p className="text-base font-serif font-light">1,500円</p>
            </div>
            <div className="rounded-lg px-3 py-2.5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] text-dim mb-1">週稼働</p>
              <p className="text-base font-serif font-light">20h</p>
            </div>
          </div>

          {/* スキル */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={11} className="text-dim" />
              <p className="text-[10px] font-mono text-dim tracking-wider">対応サービス</p>
            </div>
            <div className="space-y-1">
              {SKILLS.map((s) => (
                <p key={s} className="text-xs text-dim pl-3 border-l" style={{ borderColor: "rgba(201,168,76,0.25)" }}>
                  {s}
                </p>
              ))}
            </div>
          </div>

          {/* 案件選別基準 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={11} className="text-dim" />
              <p className="text-[10px] font-mono text-dim tracking-wider">案件選別基準</p>
            </div>
            <div className="space-y-1.5">
              {CRITERIA.map((c) => (
                <div key={c.label} className="flex items-baseline gap-2 text-xs">
                  <span className="text-dim shrink-0 w-20">{c.label}</span>
                  <span className="font-medium">{c.check}</span>
                  <span className="text-faint text-[10px]">{c.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CWプロフィール */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Star size={11} className="text-dim" />
              <p className="text-[10px] font-mono text-dim tracking-wider">クラウドワークス プロフィール</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ["総合評価", "5.0 ★"],
                ["完了率", "100%"],
                ["受注実績", "4件"],
                ["稼働可能", "10〜20h/週"],
                ["時間単価", "1,500円〜"],
                ["登録日", "2025-10-16"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-dim">{k}</span>
                  <span className="font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
