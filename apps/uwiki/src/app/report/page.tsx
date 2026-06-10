import { prisma } from "@/lib/db"
import type { Habit, HabitLog, Dream, AdjustmentLog, Case } from "@uwiki/database"
import { BarChart2, CheckSquare, Repeat2, BookOpen, Briefcase, Layers, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from "date-fns"
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
  let doneTasksList: { id: string; title: string; priority: string }[] = []
  let habits: (Habit & { logs: HabitLog[] })[] = [], habitLogsThisWeek = 0
  let diaryThisWeek: { id: string; date: string; title: string | null; mood: number | null }[] = [], diaryPrev = 0
  let past4Weeks: { label: string; rate: number }[] = []
  let dreams: Dream[] = []
  let adjustments: AdjustmentLog[] = []
  let cases: Case[] = []
  let doneCases: { paidAmount: number; reward: number }[] = []

  try {
    ;[
      tasksThisWeek, tasksDone, tasksPrev,
      habits, habitLogsThisWeek,
      diaryThisWeek, diaryPrev,
      dreams, adjustments, cases, doneCases,
    ] = await Promise.all([
      prisma.task.count({ where: { createdAt: { gte: weekStart, lte: weekEnd }, parentTaskId: null } }),
      prisma.task.count({ where: { completed: true, updatedAt: { gte: weekStart, lte: weekEnd }, parentTaskId: null } }),
      prisma.task.count({ where: { completed: true, updatedAt: { gte: prevWeekStart, lte: prevWeekEnd }, parentTaskId: null } }),
      prisma.habit.findMany({ include: { logs: { where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } } } }),
      prisma.habitLog.count({ where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } }),
      prisma.diaryEntry.findMany({ where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } }, orderBy: { date: "asc" }, select: { id: true, date: true, title: true, mood: true } }),
      prisma.diaryEntry.count({ where: { date: { gte: fmt(prevWeekStart), lte: fmt(prevWeekEnd) } } }),
      prisma.dream.findMany({ where: { achieved: false }, orderBy: { layer: "asc" }, take: 5 }),
      prisma.adjustmentLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.case.findMany({ where: { status: { not: "DONE" } }, orderBy: { createdAt: "desc" } }),
      prisma.case.findMany({ where: { status: "DONE" }, select: { paidAmount: true, reward: true } }),
    ])
  } catch (e) {
    console.error("[report] DB query failed:", e)
  }

  try {
    doneTasksList = await prisma.task.findMany({
      where: { completed: true, updatedAt: { gte: weekStart, lte: weekEnd }, parentTaskId: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true, priority: true },
    })
  } catch (e) {
    console.error("[report] doneTasksList query failed:", e)
  }

  // 今週の日別完了タスク数
  const weekDailyDone: { label: string; dayLabel: string; count: number; isToday: boolean }[] = []
  try {
    const todayStr = format(now, "yyyy-MM-dd")
    const dailyRaw = await prisma.task.findMany({
      where: { completed: true, updatedAt: { gte: weekStart, lte: weekEnd }, parentTaskId: null },
      select: { updatedAt: true },
    })
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i)
      const dStr = format(d, "yyyy-MM-dd")
      const count = dailyRaw.filter((t) => format(new Date(t.updatedAt), "yyyy-MM-dd") === dStr).length
      weekDailyDone.push({ label: format(d, "d"), dayLabel: format(d, "E", { locale: ja }), count, isToday: dStr === todayStr })
    }
  } catch (e) {
    console.error("[report] weekDailyDone query failed:", e)
  }

  try {
    past4Weeks = await Promise.all(
      Array.from({ length: 4 }, async (_, i) => {
        const s = startOfWeek(subWeeks(now, 3 - i), { locale: ja })
        const e = endOfWeek(subWeeks(now, 3 - i), { locale: ja })
        const count = await prisma.habitLog.count({ where: { date: { gte: fmt(s), lte: fmt(e) } } })
        return { label: format(s, "M/d"), rate: habits.length > 0 ? count / (habits.length * 7) : 0 }
      })
    )
  } catch (e) {
    console.error("[report] past4Weeks query failed:", e)
  }

  const weekDays = 7
  const maxHabits = habits.length * weekDays
  const habitRate = maxHabits > 0 ? habitLogsThisWeek / maxHabits : 0
  const weekLabel = `${format(weekStart, "M/d", { locale: ja })} 〜 ${format(weekEnd, "M/d", { locale: ja })}`

  const earned = doneCases.reduce((s, c) => s + (c.paidAmount || c.reward), 0)
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
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 md:gap-3 animate-fade-in delay-100" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <StatCard icon={<CheckSquare size={13} />} label="タスク完了"
            value={tasksDone}
            sub={tasksThisWeek > 0 ? `完了率 ${Math.round((tasksDone / tasksThisWeek) * 100)}%` : `先週比 ${tasksDone >= tasksPrev ? "+" : ""}${tasksDone - tasksPrev}`}
            positive={tasksDone >= tasksPrev} />
          <StatCard icon={<Repeat2 size={13} />} label="習慣達成率"
            value={`${Math.round(habitRate * 100)}%`} sub={`${habitLogsThisWeek}/${maxHabits}回`}
            positive={habitRate >= 0.7} />
          <StatCard icon={<BookOpen size={13} />} label="日記"
            value={diaryThisWeek.length} sub={`先週比 ${diaryThisWeek.length >= diaryPrev ? "+" : ""}${diaryThisWeek.length - diaryPrev}`}
            positive={diaryThisWeek.length >= diaryPrev} />
        </div>

        {/* ─── タスク日別グラフ ─── */}
        {tasksDone > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-100">
            <p className="section-label">今週の完了タスク（日別）</p>
            <div className="flex items-end gap-2 h-20 mt-3">
              {weekDailyDone.map((d) => {
                const maxCount = Math.max(...weekDailyDone.map((x) => x.count), 1)
                const h = Math.max(4, (d.count / maxCount) * 100)
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    {d.count > 0 && (
                      <p className="text-[9px] font-mono" style={{ color: d.isToday ? "var(--accent)" : "var(--faint)" }}>
                        {d.count}
                      </p>
                    )}
                    <div className="flex-1 w-full flex items-end">
                      <div className="w-full rounded-t transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          background: d.count === 0 ? "rgba(255,255,255,0.04)"
                            : d.isToday ? "var(--accent)"
                            : "rgba(58,111,201,0.55)",
                          minHeight: "4px",
                        }} />
                    </div>
                    <p className="text-[9px] font-mono" style={{ color: d.isToday ? "var(--accent)" : "var(--dim)" }}>
                      {d.dayLabel}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── 週次Check（誓約×実行） ─── */}
        <WeeklyCheck dreams={dreams} adjustments={adjustments} />

        {/* ─── 習慣グラフ ─── */}
        {past4Weeks.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-150">
            <p className="section-label">習慣達成率（過去4週）</p>
            <div className="flex items-end gap-3 h-24 mt-3">
              {past4Weeks.map((w) => (
                <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[9px] font-mono mb-0.5" style={{ color: w.rate >= 0.7 ? "var(--accent)" : "var(--faint)" }}>
                    {Math.round(w.rate * 100)}%
                  </p>
                  <div className="flex-1 w-full flex items-end">
                    <div className="w-full rounded-t transition-all duration-500"
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

        {/* ─── 案件サマリー ─── */}
        {cases.length > 0 && (
          <Link href="/cases" className="block surface rounded-xl p-5 animate-fade-in delay-200 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} style={{ color: "var(--amber)" }} />
              <p className="section-label" style={{ color: "var(--amber)" }}>ライスワーク</p>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-[10px] text-dim mb-0.5">進行中案件</p>
                <p className="text-2xl font-serif">{cases.length}<span className="text-sm text-dim ml-1">件</span></p>
              </div>
              <div className="h-8 w-px" style={{ background: "var(--border)" }} />
              <div>
                <p className="text-[10px] text-dim mb-0.5">100万円達成</p>
                <p className="text-2xl font-serif" style={{ color: "var(--amber)" }}>{earningPct}<span className="text-sm ml-0.5">%</span></p>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${earningPct}%`, background: "linear-gradient(90deg, #c9a84c, #f0c060)" }} />
            </div>
          </Link>
        )}

        {/* ─── 修正ログ（月次Act記録） ─── */}
        <AdjustmentList adjustments={adjustments} dreams={dreams} />

        {/* ─── 今週の完了タスク ─── */}
        {doneTasksList.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-200">
            <p className="section-label">今週の完了タスク</p>
            <div className="space-y-1 mt-2">
              {doneTasksList.map((t) => {
                const pc: Record<string, string> = { HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)" }
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-[var(--faint)] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pc[t.priority] }} />
                    <span className="text-sm truncate line-through text-dim">{t.title}</span>
                  </div>
                )
              })}
              {tasksDone > 6 && <p className="text-xs text-faint pl-2">他 {tasksDone - 6} 件</p>}
            </div>
          </div>
        )}

        {/* ─── 今週の日記 ─── */}
        {diaryThisWeek.length > 0 && (
          <div className="surface rounded-xl p-5 animate-fade-in delay-200">
            <p className="section-label">今週の日記</p>
            <div className="space-y-2 mt-2">
              {diaryThisWeek.map((e) => (
                <a key={e.id} href={`/diary?date=${e.date}`} className="flex items-center gap-3 py-1.5 rounded-lg px-2 hover:bg-[var(--faint)] transition-colors">
                  <span className="text-xs font-mono text-dim w-8">{format(new Date(e.date), "M/d")}</span>
                  <span className="text-sm truncate flex-1">{e.title}</span>
                  {e.mood && (
                    <span className="text-base shrink-0">{["","😞","😕","😐","🙂","😄"][e.mood]}</span>
                  )}
                </a>
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
      <div className="flex items-center gap-1 text-accent mb-1.5">{icon}
        <span className="text-[9px] md:text-[10px] font-medium leading-tight">{label}</span>
      </div>
      <p className="text-lg md:text-2xl font-serif leading-none mb-1">{value}</p>
      <p className="text-[9px] md:text-[10px] leading-tight" style={{ color: positive ? "var(--green)" : "var(--dim)" }}>{sub}</p>
    </div>
  )
}
