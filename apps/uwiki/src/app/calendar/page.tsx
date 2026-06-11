import { prisma } from "@/lib/db"
import { CalendarView } from "@/components/calendar/CalendarView"
import { AddEventButton } from "@/components/calendar/AddEventButton"
import { CalendarDays } from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions, fetchCalendarEvents, getValidToken, GoogleCalendarEvent } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const monthStr = params.month ?? format(new Date(), "yyyy-MM")
  const monthDate = parseISO(monthStr + "-01")

  const [monthStart, monthEnd] = [
    format(startOfMonth(monthDate), "yyyy-MM-dd"),
    format(endOfMonth(monthDate), "yyyy-MM-dd"),
  ]

  // Google Calendar イベント取得 — 自動トークンリフレッシュ対応
  let googleEvents: GoogleCalendarEvent[] = []
  try {
    const { prisma: db } = await import("@/lib/db")
    const calAccount = await db.googleAccount.findFirst({ where: { useCalendar: true } })
    if (calAccount) {
      const token = await getValidToken(calAccount.email)
      // 当月を中心に前後60日取得（過去月も表示できるように）
      if (token) googleEvents = await fetchCalendarEvents(token, 120, 60)
    } else {
      const session = await getServerSession(authOptions)
      if (session?.accessToken) {
        googleEvents = await fetchCalendarEvents(session.accessToken, 120, 60)
      }
    }
  } catch (e) { console.error("[page] DB query failed:", e) }

  let tasks: { id: string; title: string; priority: string; completed: boolean; dueDate: Date | null }[] = []
  let diaryEntries: { date: string; title: string; id: string }[] = []
  let habitLogs: { date: string; habitId: string }[] = []
  let habits: { id: string; color: string }[] = []
  let cases: { id: string; name: string; dueDate: Date | null; status: string }[] = []
  try {
    ;[tasks, diaryEntries, habitLogs, habits, cases] = await Promise.all([
      prisma.task.findMany({
        where: {
          dueDate: {
            gte: new Date(monthStart),
            lte: new Date(monthEnd + "T23:59:59"),
          },
        },
        orderBy: { dueDate: "asc" },
        select: { id: true, title: true, priority: true, completed: true, dueDate: true },
      }),
      prisma.diaryEntry.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        select: { date: true, title: true, id: true },
      }),
      prisma.habitLog.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
        select: { date: true, habitId: true },
      }),
      prisma.habit.findMany({ select: { id: true, color: true } }),
      prisma.case.findMany({
        where: {
          dueDate: {
            gte: new Date(monthStart),
            lte: new Date(monthEnd + "T23:59:59"),
          },
          status: { not: "DONE" },
        },
        select: { id: true, name: true, dueDate: true, status: true },
      }),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }

  const casesByDate: Record<string, { id: string; name: string; dueDate: Date; status: string }[]> = {}
  for (const c of cases) {
    if (!c.dueDate) continue
    const d = format(new Date(c.dueDate), "yyyy-MM-dd")
    if (!casesByDate[d]) casesByDate[d] = []
    casesByDate[d].push({ ...c, dueDate: c.dueDate })
  }

  // 日付 → データのマップを構築
  const tasksByDate: Record<string, typeof tasks> = {}
  for (const task of tasks) {
    if (!task.dueDate) continue
    const d = format(new Date(task.dueDate), "yyyy-MM-dd")
    if (!tasksByDate[d]) tasksByDate[d] = []
    tasksByDate[d].push(task)
  }

  const diaryByDate: Record<string, { id: string; title: string }> = {}
  for (const entry of diaryEntries) {
    diaryByDate[entry.date] = { id: entry.id, title: entry.title }
  }

  // 日ごとの習慣達成率
  const habitCountByDate: Record<string, number> = {}
  for (const log of habitLogs) {
    habitCountByDate[log.date] = (habitCountByDate[log.date] ?? 0) + 1
  }

  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM")
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM")

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">カレンダー</h1>
          {(tasks.length > 0 || diaryEntries.length > 0 || cases.length > 0) && (
            <div className="flex items-center gap-1.5 ml-1">
              {tasks.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(58,111,201,0.1)", color: "var(--accent)" }}>
                  タスク{tasks.length}
                </span>
              )}
              {diaryEntries.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.05)", color: "var(--dim)" }}>
                  日記{diaryEntries.length}
                </span>
              )}
              {cases.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(201,168,76,0.1)", color: "var(--amber)" }}>
                  案件{cases.length}
                </span>
              )}
            </div>
          )}
        </div>
        <AddEventButton defaultDate={format(new Date(), "yyyy-MM-dd")} />
      </div>

      <div className="flex-1 overflow-auto px-3 pb-4 md:px-8 md:pb-8">
        <CalendarView
          monthStr={monthStr}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          tasksByDate={tasksByDate}
          diaryByDate={diaryByDate}
          habitCountByDate={habitCountByDate}
          totalHabits={habits.length}
          googleEvents={googleEvents}
          casesByDate={casesByDate}
        />
      </div>
    </div>
  )
}
