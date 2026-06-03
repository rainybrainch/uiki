import { prisma } from "@/lib/db"
import { BarChart2, CheckSquare, Repeat2, BookOpen, Briefcase, Layers } from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"
import { WeeklyCheck } from "@/components/report/WeeklyCheck"
import { AdjustmentList } from "@/components/report/AdjustmentList"

export const dynamic = "force-dynamic"

export default async function ReportPage() {
  const now = new Date()
  const weekStart = startOfWeek(now, { locale: ja })
  const weekEnd   = endOfWeek(now, { locale: ja })
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { locale: ja })
  const prevWeekEnd   = endOfWeek(subWeeks(now, 1), { locale: ja })
  const fmt = (d: Date) => format(d, "yyyy-MM-dd")
  const currentMonth = format(now, "yyyy-MM")

  let tasksThisWeek = 0, tasksDone = 0, tasksPrev = 0
  let habits: any[] = [], habitLogsThisWeek = 0
  let diaryThisWeek: any[] = [], diaryPrev = 0
  let past4Weeks: any[] = []
  let dreams: any[] = []
  let adjustments: any[] = []
  let cases: any[] = []

  try {
    ;[
      tasksThisWeek, tasksDone, tasksPrev,
      habits, habitLogsThisWeek,
      diaryThisWeek, diaryPrev,
      dreams, adjustments, cases,
    ] = await Promise.all([
      prisma.task.count({ where: { createdAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.task.count({ where: { completed: true, updatedAt: { gte: weekStart, lte: weekEnd } } }),
      prisma.task.count({ where: { completed: true, updatedAt: { gte: prevWeekStart, lte: prevWeekEnd } } }),
      prisma.habit.findMany({ include: { logs: { where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } } } }),
      prisma.habitLog.count({ where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } }),
      prisma.diaryEntry.findMany({ where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } }, orderBy: { date: "asc" } }),
      prisma.diaryEntry.count({ where: { date: { gte: fmt(prevWeekStart), lte: fmt(prevWeekEnd) } } }),
      prisma.dream.findMany({ where: { achieved: false }, orderBy: { layer: "asc" }, take: 5 }),
      prisma.adjustmentLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.case.findMany({ where: { status: { not: "DONE" } }, orderBy: { createdAt: "desc" } }),
    ])
  } catch {}

  try {
    past4Weeks = await Promise.all(
      Array.from({ length: 4 }, async (_, i) => {
        const s = startOfWeek(subWeeks(now, 3 - i), { locale: ja })
        const e = endOfWeek(subWeeks(now, 3 - i), { locale: ja })
        const count = await prisma.habitLog.count({ where: { date: { gte: fmt(s), lte: fmt(e) } } })
        return { label: format(s, "M/d"), rate: habits.length > 0 ? count / (habits.length * 7) : 0 }
      })
    )
  } catch {}

  const weekDays = 7
  const maxHabits = habits.length * weekDays
  const habitRate = maxHabits > 0 ? habitLogsThisWeek / maxHabits : 0
  const weekLabel = `${format(weekStart, "M/d", { locale: ja })} 〜 ${format(weekEnd, "M/d", { locale: ja })}`

  const earned = cases
    .filter((c: any) => c.status === "DONE")
    .reduce((s: number, c: any) => s + (c.paidAmount || c.reward), 0)
  const earningPct = Math.min(100, Math.round((earned / 1_000_000) * 100))

  return (
    <div className="page-container max-w-2xl">
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart2 size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">週次Check</h1>
        </div>
        <p className="text-sm text-dim">{weekLabel}</p>
      </div>

      <div className="space-y-5">

        {/* ─── サマリーカード ─── */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in delay-100">
          <StatCard icon={<CheckSquare size={13} />} label="タスク完了"
            value={tasksDone} sub={`先週比 ${tasksDone >= tasksPrev ? "+" : ""}${tasksDone - tasksPrev}`}
            positive={tasksDone >= tasksPrev} />
          <StatCard icon={<Repeat2 size={13} />} label="習慣達成率"
            value={`${Math.round(habitRate * 100)}%`} sub={`${habitLogsThisWeek}/${maxHabits}回`}
            positive={habitRate >= 0.7} />
          <StatCard icon={<BookOpen size={13} />} label="日記"
            value={diaryThisWeek.length} sub={`先週比 ${diaryThisWeek.length >= diaryPrev ? "+" : ""}${diaryThisWeek.length - diaryPrev}`}
            positive={diaryThisWeek.length >= diaryPrev} />
        </div>

        {/* ─── 週次Check（誓約×実行） ─── */}
        <WeeklyCheck dreams={dreams} adjustments={adjustments} />

        {/* ─── 習慣グラフ ─── */}
        {past4Weeks.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-150">
            <p className="section-label">習慣達成率（過去4週）</p>
            <div className="flex items-end gap-3 h-20 mt-3">
              {past4Weeks.map((w) => (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex-1 w-full flex items-end">
                    <div className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(4, w.rate * 100)}%`,
                        background: w.rate >= 0.7 ? "var(--accent)" : w.rate >= 0.4 ? "rgba(58,111,201,0.5)" : "var(--faint)",
                      }} />
                  </div>
                  <p className="text-[9px] font-mono text-dim">{w.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 習慣内訳 ─── */}
        {habits.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-200">
            <p className="section-label">今週の習慣内訳</p>
            <div className="space-y-3 mt-2">
              {habits.map((h) => {
                const done = h.logs.length
                const rate = done / 7
                return (
                  <div key={h.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.color }} />
                    <span className="text-sm flex-1">{h.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--faint)" }}>
                        <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, background: h.color }} />
                      </div>
                      <span className="text-xs font-mono text-dim w-7 text-right">{done}/7</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── 修正ログ（月次Act記録） ─── */}
        <AdjustmentList adjustments={adjustments} dreams={dreams} />

        {/* ─── 今週の日記 ─── */}
        {diaryThisWeek.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-200">
            <p className="section-label">今週の日記</p>
            <div className="space-y-2 mt-2">
              {diaryThisWeek.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-1">
                  <span className="text-xs font-mono text-dim w-10">{format(new Date(e.date), "M/d")}</span>
                  <span className="text-sm truncate">{e.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, positive }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; positive: boolean
}) {
  return (
    <div className="surface rounded-xl p-3 md:p-4">
      <div className="flex items-center gap-1.5 text-accent mb-2">{icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-xl md:text-2xl font-serif">{value}</p>
      <p className="text-[10px] mt-1" style={{ color: positive ? "var(--green)" : "var(--dim)" }}>{sub}</p>
    </div>
  )
}
