import { prisma } from "@/lib/db"
import { BarChart2, CheckSquare, Repeat2, BookOpen } from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function ReportPage() {
  const now = new Date()
  const weekStart = startOfWeek(now, { locale: ja })
  const weekEnd = endOfWeek(now, { locale: ja })

  const prevWeekStart = startOfWeek(subWeeks(now, 1), { locale: ja })
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ja })

  const fmt = (d: Date) => format(d, "yyyy-MM-dd")

  const [
    tasksThisWeek, tasksDone, tasksPrev,
    habits, habitLogsThisWeek,
    diaryThisWeek, diaryPrev,
  ] = await Promise.all([
    prisma.task.count({ where: { createdAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({ where: { completed: true, updatedAt: { gte: weekStart, lte: weekEnd } } }),
    prisma.task.count({ where: { completed: true, updatedAt: { gte: prevWeekStart, lte: prevWeekEnd } } }),
    prisma.habit.findMany({ include: { logs: { where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } } } }),
    prisma.habitLog.count({ where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } } }),
    prisma.diaryEntry.findMany({
      where: { date: { gte: fmt(weekStart), lte: fmt(weekEnd) } },
      orderBy: { date: "asc" },
    }),
    prisma.diaryEntry.count({ where: { date: { gte: fmt(prevWeekStart), lte: fmt(prevWeekEnd) } } }),
  ])

  const weekDays = 7
  const maxHabits = habits.length * weekDays
  const habitRate = maxHabits > 0 ? habitLogsThisWeek / maxHabits : 0

  const weekLabel = `${format(weekStart, "M/d", { locale: ja })} 〜 ${format(weekEnd, "M/d", { locale: ja })}`

  // 過去4週の習慣達成率グラフ用データ
  const past4Weeks = await Promise.all(
    Array.from({ length: 4 }, async (_, i) => {
      const s = startOfWeek(subWeeks(now, 3 - i), { locale: ja })
      const e = endOfWeek(subWeeks(now, 3 - i), { locale: ja })
      const count = await prisma.habitLog.count({ where: { date: { gte: fmt(s), lte: fmt(e) } } })
      return {
        label: format(s, "M/d"),
        rate: maxHabits > 0 ? count / (habits.length * 7) : 0,
      }
    })
  )

  return (
    <div className="page-container max-w-2xl">
      <div className="animate-fade-in mb-10">
        <div className="flex items-center gap-3 mb-1">
          <BarChart2 size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">週次レポート</h1>
        </div>
        <p className="text-sm text-dim ml-7">{weekLabel}</p>
      </div>

      <div className="space-y-6 animate-fade-in delay-100">

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<CheckSquare size={14} />}
            label="タスク完了"
            value={tasksDone}
            sub={`先週比 ${tasksDone >= tasksPrev ? "+" : ""}${tasksDone - tasksPrev}`}
            positive={tasksDone >= tasksPrev}
          />
          <StatCard
            icon={<Repeat2 size={14} />}
            label="習慣達成率"
            value={`${Math.round(habitRate * 100)}%`}
            sub={`${habitLogsThisWeek} / ${maxHabits} 回`}
            positive={habitRate >= 0.7}
          />
          <StatCard
            icon={<BookOpen size={14} />}
            label="日記投稿"
            value={diaryThisWeek.length}
            sub={`先週比 ${diaryThisWeek.length >= diaryPrev ? "+" : ""}${diaryThisWeek.length - diaryPrev}`}
            positive={diaryThisWeek.length >= diaryPrev}
          />
        </div>

        {/* 習慣達成率グラフ（4週） */}
        <div className="surface rounded-xl p-5">
          <p className="section-label">習慣達成率（過去4週）</p>
          <div className="flex items-end gap-3 h-24 mt-4">
            {past4Weeks.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(4, w.rate * 100)}%`,
                      background: w.rate >= 0.7 ? "var(--accent)" : w.rate >= 0.4 ? "rgba(58,111,201,0.5)" : "var(--faint)",
                    }}
                  />
                </div>
                <p className="text-[9px] font-mono text-dim">{w.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 習慣ごとの今週 */}
        {habits.length > 0 && (
          <div className="surface rounded-xl p-5">
            <p className="section-label">今週の習慣内訳</p>
            <div className="space-y-3 mt-3">
              {habits.map((habit) => {
                const done = habit.logs.length
                const rate = done / 7
                return (
                  <div key={habit.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: habit.color }} />
                    <span className="text-sm flex-1">{habit.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--faint)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${rate * 100}%`, background: habit.color }}
                        />
                      </div>
                      <span className="text-xs font-mono text-dim w-8 text-right">{done}/7</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 今週の日記 */}
        {diaryThisWeek.length > 0 && (
          <div className="surface rounded-xl p-5">
            <p className="section-label">今週の日記</p>
            <div className="space-y-2 mt-3">
              {diaryThisWeek.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-1">
                  <span className="text-xs font-mono text-dim w-12">{format(new Date(entry.date), "M/d")}</span>
                  <span className="text-sm truncate">{entry.title}</span>
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
    <div className="surface rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-accent mb-2">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-serif">{value}</p>
      <p className="text-[10px] mt-1" style={{ color: positive ? "var(--green)" : "var(--dim)" }}>
        {sub}
      </p>
    </div>
  )
}
