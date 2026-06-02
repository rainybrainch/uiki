import { prisma } from "@/lib/db"
import { today } from "@/lib/date"
import { DiaryEditor } from "@/components/diary/DiaryEditor"
import { DiaryCalendar } from "@/components/diary/DiaryCalendar"
import { BookOpen } from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"

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

  let currentEntry: any = null
  let monthEntries: any[] = []
  try {
    ;[currentEntry, monthEntries] = await Promise.all([
      prisma.diaryEntry.findUnique({ where: { date: selectedDate } }),
      prisma.diaryEntry.findMany({
        where: {
          date: {
            gte: format(monthStart, "yyyy-MM-dd"),
            lte: format(monthEnd, "yyyy-MM-dd"),
          },
        },
        select: { date: true },
      }),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }

  const entryDates = monthEntries.map((e) => e.date)

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-10">
        <BookOpen size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-serif font-light tracking-wide">日記</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <DiaryCalendar
          selectedDate={selectedDate}
          monthStr={monthStr}
          entryDates={entryDates}
        />
        <DiaryEditor date={selectedDate} entry={currentEntry} />
      </div>
    </div>
  )
}
