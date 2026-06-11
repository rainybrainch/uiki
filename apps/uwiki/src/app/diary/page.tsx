import { prisma } from "@/lib/db"
import type { DiaryEntry } from "@uwiki/database"
import { today, calcStreak } from "@/lib/date"
import { DiaryEditor } from "@/components/diary/DiaryEditor"
import { DiaryCalendar } from "@/components/diary/DiaryCalendar"
import { BookOpen } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, addDays, subDays } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>
}) {
  const params = await searchParams
  const selectedDate = params.date ?? today()
  const monthStr = params.month ?? format(new Date(), "yyyy-MM")

  const [monthStart, monthEnd] = [
    startOfMonth(parseISO(monthStr + "-01")),
    endOfMonth(parseISO(monthStr + "-01")),
  ]

  let currentEntry: DiaryEntry | null = null
  let monthEntries: { date: string; mood: number | null }[] = []
  let allDates: string[] = []
  try {
    ;[currentEntry, monthEntries, allDates] = await Promise.all([
      prisma.diaryEntry.findUnique({ where: { date: selectedDate } }),
      prisma.diaryEntry.findMany({
        where: {
          date: {
            gte: format(monthStart, "yyyy-MM-dd"),
            lte: format(monthEnd, "yyyy-MM-dd"),
          },
        },
        select: { date: true, mood: true },
      }),
      prisma.diaryEntry.findMany({
        select: { date: true },
        orderBy: { date: "desc" },
      }).then((es) => es.map((e) => e.date)),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }

  const streak = calcStreak(allDates)
  const totalEntries = allDates.length

  const todayStr = today()
  const prevDate = format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
  const nextDate = format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
  const isToday = selectedDate === todayStr

  // 月が変わる場合は month パラメータも更新
  const prevMonth = format(subDays(parseISO(selectedDate), 1), "yyyy-MM")
  const nextMonth = format(addDays(parseISO(selectedDate), 1), "yyyy-MM")

  const entryDates = monthEntries.map((e) => e.date)
  const moodByDate: Record<string, number> = {}
  for (const e of monthEntries) {
    if (e.mood != null) moodByDate[e.date] = e.mood
  }

  const moodedEntries = monthEntries.filter((e) => e.mood != null)
  const avgMoodThisMonth = moodedEntries.length > 0
    ? moodedEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / moodedEntries.length
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-10">
      <div className="flex items-center justify-between mb-6 md:mb-10">
        <div className="flex items-center gap-3">
          <BookOpen size={18} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-xl md:text-2xl font-serif font-light tracking-wide">日記</h1>
          {/* 日付ナビゲーション */}
          <div className="flex items-center gap-1">
            <Link
              href={`/diary?date=${prevDate}&month=${prevMonth}`}
              className="p-1 rounded-lg transition-colors hover:bg-[var(--faint)] text-dim hover:text-white"
              aria-label="前の日"
            >
              <ChevronLeft size={15} />
            </Link>
            <span className="text-xs font-mono text-dim px-1">
              {format(parseISO(selectedDate), "yyyy/MM/dd (E)", { locale: ja })}
            </span>
            {isToday ? (
              <span className="p-1 text-faint" aria-hidden>
                <ChevronRight size={15} />
              </span>
            ) : (
              <Link
                href={`/diary?date=${nextDate}&month=${nextMonth}`}
                className="p-1 rounded-lg transition-colors hover:bg-[var(--faint)] text-dim hover:text-white"
                aria-label="次の日"
              >
                <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{
                background: streak >= 7 ? "rgba(74,222,128,0.08)" : "rgba(58,111,201,0.06)",
                border: `1px solid ${streak >= 7 ? "rgba(74,222,128,0.25)" : "var(--border)"}`,
              }}>
              <span className="text-sm">{streak >= 30 ? "🔥" : streak >= 7 ? "✨" : "🌧"}</span>
              <span className="text-xs font-mono font-medium"
                style={{ color: streak >= 7 ? "var(--green)" : "var(--accent)" }}>
                {streak}日連続
              </span>
            </div>
          )}
          {avgMoodThisMonth !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
              <span className="text-sm">{["","😞","😕","😐","🙂","😄"][Math.round(avgMoodThisMonth)]}</span>
              <span className="text-xs font-mono" style={{ color: "var(--dim)" }}>
                {avgMoodThisMonth.toFixed(1)}
              </span>
            </div>
          )}
          {totalEntries > 0 && (
            <span className="text-xs font-mono text-faint hidden sm:block">
              計{totalEntries}件
            </span>
          )}
        </div>
      </div>

      {/* モバイル: エディタ → カレンダー  /  PC: カレンダー | エディタ */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 md:gap-8">
        <div className="order-2 md:order-1">
          <DiaryCalendar
            selectedDate={selectedDate}
            monthStr={monthStr}
            entryDates={entryDates}
            moodByDate={moodByDate}
          />
        </div>
        <div className="order-1 md:order-2">
          <DiaryEditor date={selectedDate} entry={currentEntry} />
        </div>
      </div>
    </div>
  )
}
