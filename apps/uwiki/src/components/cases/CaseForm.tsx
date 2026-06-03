"use client"

import { useState, useTransition } from "react"
import { createCase } from "@/actions/cases"
import { Plus } from "lucide-react"

const CATEGORIES = ["AI開発", "Web制作", "アプリ開発", "デザイン", "コンサル", "その他"]

export function CaseForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [client, setClient] = useState("")
  const [reward, setReward] = useState("")
  const [category, setCategory] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [memo, setMemo] = useState("")
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setName(""); setClient(""); setReward(""); setCategory(""); setDueDate(""); setMemo("")
    setOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !reward) return
    startTransition(async () => {
      await createCase({
        name: name.trim(),
        client: client || undefined,
        reward: Number(reward),
        category: category || undefined,
        dueDate: dueDate || undefined,
        memo: memo || undefined,
      })
      reset()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
        style={{ background: "rgba(201,168,76,0.08)", border: "1px dashed rgba(201,168,76,0.3)", color: "var(--amber)" }}
      >
        <Plus size={15} />
        新しい案件を追加
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-5" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="案件名 *" required
          className="col-span-2 input-base"
        />
        <input
          value={client} onChange={(e) => setClient(e.target.value)}
          placeholder="クライアント名"
          className="input-base"
        />
        <input
          value={reward} onChange={(e) => setReward(e.target.value)}
          type="number" placeholder="報酬（円） *" required
          className="input-base"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
          <option value="">カテゴリ</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          type="date" className="input-base"
        />
        <textarea
          value={memo} onChange={(e) => setMemo(e.target.value)}
          placeholder="メモ" rows={2}
          className="col-span-2 input-base resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit" disabled={!name.trim() || !reward || isPending}
          className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--amber)", color: "#060c1a" }}
        >
          追加
        </button>
        <button type="button" onClick={reset}
          className="px-4 py-2 rounded-lg text-sm text-dim transition-colors hover:text-white"
          style={{ border: "1px solid var(--border)" }}
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
