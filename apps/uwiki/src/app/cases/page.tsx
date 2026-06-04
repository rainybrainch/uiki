import { prisma } from "@/lib/db"
import { CasePipeline } from "@/components/cases/CasePipeline"
import { CaseForm } from "@/components/cases/CaseForm"
import { Briefcase } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const GOAL = 1_000_000

const STATUS_ORDER = ["ACQUIRED", "DEVELOPING", "DELIVERED", "WAITING_PAY", "DONE"]
const STATUS_LABELS: Record<string, string> = {
  ACQUIRED:    "獲得",
  DEVELOPING:  "開発中",
  DELIVERED:   "納品済み",
  WAITING_PAY: "支払い待ち",
  DONE:        "完了",
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  let cases: any[] = []
  let allCases: any[] = []
  try {
    ;[cases, allCases] = await Promise.all([
      prisma.case.findMany({
        where: filter && filter !== "all" ? { status: filter as any } : {},
        orderBy: { createdAt: "desc" },
      }),
      prisma.case.findMany({ orderBy: { createdAt: "desc" } }),
    ])
  } catch {}

  const earned = allCases
    .filter((c) => c.status === "DONE")
    .reduce((s, c) => s + (c.paidAmount || c.reward), 0)

  const pending = allCases
    .filter((c) => c.status === "WAITING_PAY")
    .reduce((s, c) => s + c.reward, 0)

  const pct = Math.round((earned / GOAL) * 100)

  const byCat = STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABELS[s],
    cases: cases.filter((c) => c.status === s),
  }))

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
      {/* ヘッダー */}
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase size={20} strokeWidth={1.5} style={{ color: "var(--amber)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">案件</h1>
          <span className="text-xs font-mono text-dim ml-1">ライスワーク</span>
        </div>

        {/* 100万円カウンター */}
        <div
          className="rounded-xl p-5 mb-2"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-dim mb-1">獲得額</p>
              <p className="text-2xl md:text-3xl font-serif font-light" style={{ color: "var(--amber)" }}>
                ¥{earned.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-dim mb-1">目標</p>
              <p className="text-base md:text-lg font-mono text-dim">¥1,000,000</p>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full animate-bar-grow"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: pct >= 100
                  ? "var(--green)"
                  : "linear-gradient(90deg, #c9a84c, #f0c060)",
              }}
            />
          </div>

          <div className="flex justify-between mt-2 text-xs font-mono">
            <span style={{ color: "var(--amber)" }}>{pct}%</span>
            <span className="text-dim">
              {earned >= GOAL
                ? `目標達成！+¥${(earned - GOAL).toLocaleString()}超過`
                : `あと ¥${(GOAL - earned).toLocaleString()}`}
            </span>
            {pending > 0 && (
              <span className="text-dim">
                支払い待ち ¥{pending.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* 統計 + フィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
          <Link
            href="/cases"
            className={`rounded-lg p-3 text-center shrink-0 min-w-[72px] transition-colors ${!filter || filter === "all" ? "bg-[rgba(58,111,201,0.15)] border border-[rgba(58,111,201,0.4)]" : "surface hover:bg-[var(--faint)]"}`}
          >
            <p className={`text-lg font-serif ${!filter || filter === "all" ? "text-white" : ""}`}>{cases.length}</p>
            <p className={`text-[10px] whitespace-nowrap ${!filter || filter === "all" ? "text-[var(--accent)]" : "text-dim"}`}>すべて</p>
          </Link>
          {STATUS_ORDER.map((s) => {
            const count = cases.filter((c) => c.status === s).length
            const active = filter === s
            const empty = count === 0 && !active
            return (
              <Link
                key={s}
                href={`/cases?filter=${s}`}
                className={`rounded-lg p-3 text-center shrink-0 min-w-[72px] transition-all ${active ? "bg-[rgba(58,111,201,0.15)] border border-[rgba(58,111,201,0.4)]" : "surface hover:bg-[var(--faint)]"}`}
                style={{ opacity: empty ? 0.45 : 1 }}
              >
                <p className={`text-lg font-serif ${active ? "text-white" : ""}`}>{count}</p>
                <p className={`text-[10px] whitespace-nowrap ${active ? "text-[var(--accent)]" : "text-dim"}`}>{STATUS_LABELS[s]}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* フォーム + パイプライン */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8 md:pb-12">
        <div className="mb-6">
          <CaseForm />
        </div>
        <CasePipeline columns={byCat} />
      </div>
    </div>
  )
}
