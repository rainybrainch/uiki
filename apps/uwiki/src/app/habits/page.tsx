import { prisma } from "@/lib/db"
import type { Habit, HabitLog } from "@uwiki/database"
import { today, calcStreak, calcBestStreak } from "@/lib/date"
import { HabitGrid } from "@/components/habits/HabitGrid"
import { HabitHeatmap } from "@/components/habits/HabitHeatmap"
import { HabitForm } from "@/components/habits/HabitForm"
import { Repeat2 } from "lucide-react"
import { format, subDays } from "date-fns"
import { ja } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function HabitsPage() {
  const todayStr = today()

  let habits: (Habit & { logs: HabitLog[] })[] = []
  try {
    habits = await prisma.habit.findMany({
      // ヒートマップ用に8週(56日)+バッファ分取得
      include: { logs: { orderBy: { date: "desc" } } },
      orderBy: { createdAt: "asc" },
    })
  } catch (e) {
    console.error("[habits] DB query failed:", e)
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "d"),
      dayLabel: format(d, "E", { locale: ja }),
    }
  })

  const habitsWithStats = habits.map((h) => {
    const logDates = h.logs.map((l) => l.date)
    return {
      ...h,
      streak: calcStreak(logDates),
      bestStreak: calcBestStreak(logDates),
      doneToday: h.logs.some((l) => l.date === todayStr),
      logDates,
    }
  })

  const doneCount = habitsWithStats.filter((h) => h.doneToday).length

  return (
    <div className="page-container">
      <div className="animate-fade-in mb-10">
        <div className="flex items-center gap-3 mb-1">
          <Repeat2 size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">習慣</h1>
        </div>
        <p className="text-sm text-dim ml-7">
          今日{" "}
          <span className="font-mono" style={{ color: doneCount === habits.length && habits.length > 0 ? "var(--green)" : "var(--accent)" }}>
            {doneCount} / {habits.length}
          </span>{" "}
          件完了
        </p>
        {doneCount === habits.length && habits.length > 0 && (
          <div className="mt-4 rounded-xl px-5 py-4 animate-pop-in"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--green)" }}>🌧 今日の習慣、全部済み！</p>
            <p className="text-xs text-dim mt-0.5">雨が降り続けている。この積み重ねが、やがて大きな流れになる。</p>
          </div>
        )}
      </div>

      <div className="animate-fade-in delay-100">
        <HabitForm />
      </div>

      <div className="mt-8 animate-fade-in delay-150">
        {habitsWithStats.length === 0 ? (
          <div className="surface rounded-xl py-16 text-center">
            <div className="text-3xl mb-3 opacity-25">🌱</div>
            <p className="text-sm text-faint mb-1">習慣がまだありません</p>
            <p className="text-xs text-faint opacity-60">毎日の小さな積み重ねが、やがて大きな流れになる。</p>
          </div>
        ) : (
          <div className="xl:grid xl:grid-cols-[1fr_320px] xl:gap-8 xl:items-start">
            {/* 左: 7日グリッド */}
            <HabitGrid habits={habitsWithStats} last7={last7} todayStr={todayStr} />

            {/* 右: ヒートマップ（PC は右カラム / モバイルは下） */}
            <div className="mt-8 xl:mt-0 space-y-4">
              {habitsWithStats.map((habit) => (
                <div key={habit.id} className="surface rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: habit.color }} />
                    <p className="text-sm font-medium">{habit.name}</p>
                  </div>
                  <HabitHeatmap
                    logDates={habit.logDates}
                    color={habit.color}
                    name={habit.name}
                    createdAt={habit.createdAt}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
