import { prisma } from "@/lib/db"
import { today, calcStreak } from "@/lib/date"
import { HabitGrid } from "@/components/habits/HabitGrid"
import { HabitHeatmap } from "@/components/habits/HabitHeatmap"
import { HabitForm } from "@/components/habits/HabitForm"
import { Repeat2 } from "lucide-react"
import { format, subDays } from "date-fns"
import { ja } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function HabitsPage() {
  const todayStr = today()

  let habits: any[] = []
  try {
    habits = await prisma.habit.findMany({
      // ヒートマップ用に15週(105日)分取得
      include: { logs: { orderBy: { date: "desc" }, take: 110 } },
      orderBy: { createdAt: "asc" },
    })
  } catch {
    // DB未接続時はデフォルト値
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "d"),
      dayLabel: format(d, "E", { locale: ja }),
    }
  })

  const habitsWithStats = habits.map((h: any) => ({
    ...h,
    streak: calcStreak(h.logs.map((l: any) => l.date)),
    doneToday: h.logs.some((l: any) => l.date === todayStr),
    logDates: h.logs.map((l: any) => l.date),
  }))

  const doneCount = habitsWithStats.filter((h) => h.doneToday).length

  return (
    <div className="page-container">
      <div className="animate-fade-in mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Repeat2 size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">習慣</h1>
        </div>
        <p className="text-sm text-dim ml-7">
          今日 <span className="font-mono text-accent">{doneCount} / {habits.length}</span> 件完了
        </p>
      </div>

      <div className="animate-fade-in delay-100">
        <HabitForm />
      </div>

      <div className="mt-8 animate-fade-in delay-150">
        {habitsWithStats.length === 0 ? (
          <div className="surface rounded-xl py-16 text-center">
            <p className="text-sm text-faint">習慣を追加してください</p>
          </div>
        ) : (
          <>
            {/* 7日グリッド */}
            <HabitGrid habits={habitsWithStats} last7={last7} todayStr={todayStr} />

            {/* ヒートマップ（習慣ごと） */}
            <div className="mt-8 space-y-6">
              {habitsWithStats.map((habit) => (
                <div key={habit.id} className="surface rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: habit.color }} />
                    <p className="text-sm font-medium">{habit.name}</p>
                  </div>
                  <HabitHeatmap
                    logDates={habit.logDates}
                    color={habit.color}
                    name={habit.name}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
