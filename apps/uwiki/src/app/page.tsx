import { prisma } from "@/lib/db"
import { today, calcStreak, formatDisplay } from "@/lib/date"
import { format, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import { CheckSquare, Repeat2, BookOpen, ArrowRight, AlertCircle, Briefcase, Layers, Clock, CloudRain, CalendarDays } from "lucide-react"
import { isToday, isPast } from "date-fns"
import Link from "next/link"
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox"
import { HabitCheckButton } from "@/components/habits/HabitCheckButton"
import { QuickAddTask } from "@/components/dashboard/QuickAddTask"
import { OnboardingCard } from "@/components/dashboard/OnboardingCard"
import { getWeatherFromSettings } from "@/lib/weather"
import { getValidToken, fetchCalendarEvents } from "@/lib/auth"

export const dynamic = "force-dynamic"

const GOAL_100MAN = 1_000_000

function getGreeting(hour: number): { text: string; sub: string } {
  if (hour < 5)  return { text: "おかえり",    sub: "深夜の雨が、静かに降っている。" }
  if (hour < 11) return { text: "おはよう",    sub: "今日の雨が、ゆっくりと始まっている。" }
  if (hour < 17) return { text: "おかえり",    sub: "雨がまだ降っている。" }
  if (hour < 21) return { text: "ゆっくりと",  sub: "夕雨の中へ、おかえり。" }
  return               { text: "おかえり",    sub: "静かな夜雨の中で。" }
}

export default async function DashboardPage() {
  const todayStr = today()
  const greeting = getGreeting(new Date().getHours())

  let tasks: any[] = []
  let habits: any[] = []
  let recentDiaries: any[] = []
  let doneTasks = 0
  let totalActiveTasks = 0
  let overdueCount = 0
  let cases: any[] = []
  let dreams: any[] = []
  let projects: any[] = []
  let weather: any = null
  let todayGEvents: any[] = []

  try {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
    weather = settings ? await getWeatherFromSettings(settings) : null
  } catch {}

  try {
    const calAccount = await prisma.googleAccount.findFirst({ where: { useCalendar: true } })
    if (calAccount) {
      const token = await getValidToken(calAccount.email)
      if (token) {
        const all = await fetchCalendarEvents(token, 1, 0)
        const td = format(new Date(), "yyyy-MM-dd")
        todayGEvents = all.filter((e: any) => {
          const d = e.start.dateTime ? format(new Date(e.start.dateTime), "yyyy-MM-dd") : e.start.date
          return d === td
        }).sort((a: any, b: any) => {
          const ta = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0
          const tb = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0
          return ta - tb
        })
      }
    }
  } catch {}

  try {
    ;[tasks, habits, recentDiaries, doneTasks, totalActiveTasks, overdueCount, cases, dreams, projects] = await Promise.all([
      prisma.task.findMany({
        where: { completed: false, parentTaskId: null },
        // dueDate が近い（期限切れ含む）→ 優先度高い → 作成日 の順で表示
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
        include: { project: { select: { id: true, name: true, color: true } } },
        take: 8,
      }),
      prisma.habit.findMany({
        include: { logs: { orderBy: { date: "desc" }, take: 30 } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.diaryEntry.findMany({ orderBy: { date: "desc" }, take: 3, select: { id: true, date: true, title: true, content: true, mood: true } }),
      prisma.task.count({ where: { completed: true, parentTaskId: null } }),
      prisma.task.count({ where: { completed: false, parentTaskId: null } }),
      prisma.task.count({
        where: {
          completed: false,
          parentTaskId: null,
          dueDate: { lt: startOfDay(new Date()) },
        },
      }),
      prisma.case.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.dream.findMany({ orderBy: [{ achieved: "asc" }, { layer: "asc" }] }),
      prisma.project.findMany({ where: { archived: false }, orderBy: { order: "asc" }, select: { id: true, name: true, color: true } }),
    ])
  } catch {
    // DB未接続時はダッシュボードを空で表示
  }

  const doneHabitsToday = habits.filter((h: any) => h.logs.some((l: any) => l.date === todayStr)).length

  // 100万円カウンター
  const earned = cases.filter((c: any) => c.status === "DONE").reduce((s: number, c: any) => s + (c.paidAmount || c.reward), 0)
  const pending = cases.filter((c: any) => c.status === "WAITING_PAY").reduce((s: number, c: any) => s + c.reward, 0)
  const earningPct = Math.min(100, Math.round((earned / GOAL_100MAN) * 100))

  // 百層世界
  const dreamAchieved = dreams.filter((d: any) => d.achieved).length
  const dreamTotal = dreams.length
  const dreamPct = Math.round((dreamAchieved / Math.max(dreamTotal, 1)) * 100)

  const priorityColor: Record<string, string> = {
    HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
  }

  return (
    <div className="min-h-screen max-w-[1400px] mx-auto">
      <section className="px-4 pt-8 pb-6 md:px-8 md:pt-12 md:pb-8 lg:px-10 lg:pt-14 xl:px-16 animate-fade-in relative overflow-hidden">
        {/* ambient light */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(58,111,201,0.07) 0%, transparent 70%)",
        }} />
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono tracking-widest text-dim relative">
            {format(new Date(), "yyyy / MM / dd  E", { locale: ja })}
          </p>
          {weather && (
            <Link href="/settings" className="flex items-center gap-2 text-xs text-dim hover:text-white transition-colors relative">
              <CloudRain size={11} style={{ color: "var(--accent)" }} />
              <span>{weather.city}</span>
              <span className="font-mono">{weather.temperature}°C</span>
              <span className="text-faint">{weather.description}</span>
            </Link>
          )}
        </div>
        <h1 className="font-serif text-3xl md:text-3xl lg:text-4xl font-light tracking-wider leading-none mb-1 relative">
          {greeting.text}
        </h1>
        <p className="text-sm mt-2 relative" style={{ color: "rgba(255,255,255,0.58)" }}>
          {greeting.sub}
        </p>

        {/* クイックタ��ク追加 — greeting 直下でいつでも��力できる */}
        <div className="mt-5 relative max-w-xl">
          <QuickAddTask projects={projects} />
        </div>

        <div className="mt-4 max-w-xl">
          <OnboardingCard />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 mt-4">
          <StatPill value={totalActiveTasks} label="未完了" color="var(--accent)" href="/tasks" />
          <StatPill value={`${doneHabitsToday}/${habits.length}`} label="今日の習慣" color="var(--green)" href="/habits" />
          <StatPill value={doneTasks} label="完了済み" color="var(--dim)" href="/tasks?view=all" />
          {overdueCount > 0 ? (
            <a href="/tasks?view=overdue" className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs transition-opacity hover:opacity-80" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={11} style={{ color: "var(--red)" }} />
              <span className="font-mono font-medium" style={{ color: "var(--red)" }}>{overdueCount}</span>
              <span style={{ color: "rgba(248,113,113,0.8)" }}>超過</span>
            </a>
          ) : (
            <StatPill value="✓" label="期限OK" color="var(--green)" href="/tasks?view=upcoming" />
          )}
        </div>

        {/* 大目標ウィジェット */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {/* 100万円 */}
          <Link href="/cases" className="rounded-xl p-4 hover:opacity-80 hover:-translate-y-0.5 transition-all block animate-slide-up delay-200"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={12} style={{ color: "var(--amber)" }} />
              <span className="text-xs text-dim">ライスワーク</span>
            </div>
            <p className="text-xl font-serif font-light mb-2" style={{ color: "var(--amber)" }}>
              ¥{earned.toLocaleString()}
              <span className="text-xs text-dim ml-1">/ 100万</span>
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full animate-bar-grow" style={{ width: `${earningPct}%`, background: "linear-gradient(90deg, #c9a84c, #f0c060)" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">{earningPct}%{pending > 0 && ` · 待ち ¥${pending.toLocaleString()}`}</p>
          </Link>

          {/* 百層世界 */}
          <Link href="/dreams" className="rounded-xl p-4 hover:opacity-80 hover:-translate-y-0.5 transition-all block animate-slide-up delay-300"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={12} style={{ color: "#8b5cf6" }} />
              <span className="text-xs text-dim">百層世界</span>
            </div>
            <p className="text-xl font-serif font-light mb-2" style={{ color: "#8b5cf6" }}>
              {dreamTotal}
              <span className="text-xs text-dim ml-1">/ 100層</span>
            </p>
            {/* 2段バー: 下=入力済み(薄), 上=達成(濃) */}
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, dreamTotal)}%`, background: "rgba(139,92,246,0.35)" }} />
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${dreamPct}%`, background: "#8b5cf6" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">{dreamTotal}層入力 · {dreamAchieved}層達成</p>
          </Link>

          {/* 習慣達成率 */}
          <Link href="/habits" className="hidden sm:block rounded-xl p-4 hover:opacity-80 hover:-translate-y-0.5 transition-all animate-slide-up delay-400"
            style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Repeat2 size={12} style={{ color: "var(--green)" }} />
              <span className="text-xs text-dim">習慣達成</span>
            </div>
            <p className="text-xl font-serif font-light mb-2" style={{ color: "var(--green)" }}>
              {doneHabitsToday}<span className="text-xs text-dim ml-1">/ {habits.length}</span>
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: habits.length > 0 ? `${(doneHabitsToday / habits.length) * 100}%` : "0%", background: "var(--green)" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">今日 {habits.length > 0 ? Math.round((doneHabitsToday / habits.length) * 100) : 0}%</p>
          </Link>

          {/* タスク完了数 */}
          <Link href="/tasks" className="hidden sm:block rounded-xl p-4 hover:opacity-80 hover:-translate-y-0.5 transition-all animate-slide-up delay-500"
            style={{ background: "rgba(58,111,201,0.06)", border: "1px solid rgba(58,111,201,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare size={12} style={{ color: "var(--accent)" }} />
              <span className="text-xs text-dim">完了タスク</span>
            </div>
            <p className="text-xl font-serif font-light mb-2" style={{ color: "var(--accent)" }}>
              {doneTasks}<span className="text-xs text-dim ml-1">件</span>
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: doneTasks > 0 ? `${Math.min(100, (doneTasks / Math.max(doneTasks + totalActiveTasks, 1)) * 100)}%` : "0%", background: "var(--accent)" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">未完了 {totalActiveTasks}件</p>
          </Link>
        </div>
      </section>

      {/* 今日のGoogleカレンダー予定 */}
      {todayGEvents.length > 0 && (
        <div className="px-4 pb-3 md:px-8 lg:px-10 xl:px-16 animate-fade-in">
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={11} style={{ color: "#4ade80" }} />
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "#4ade80" }}>TODAY'S SCHEDULE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayGEvents.map((ev: any) => {
                const timeStr = ev.start.dateTime
                  ? (() => { const d = new Date(ev.start.dateTime); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}` })()
                  : "終日"
                return (
                  <a key={ev.id} href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "var(--text)" }}>
                    <span className="font-mono text-[10px]" style={{ color: "#4ade80" }}>{timeStr}</span>
                    <span>{ev.summary}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 今日のフォーカス — タスクと大目標の接続 */}
      {totalActiveTasks > 0 && (() => {
        // HIGH優先を先に、最大3件
        const focusTasks = [
          ...tasks.filter((t) => t.priority === "HIGH"),
          ...tasks.filter((t) => t.priority !== "HIGH"),
        ].slice(0, 3)
        return (
          <div className="px-4 pb-4 md:px-8 lg:px-10 xl:px-16 animate-fade-in delay-100">
            <div className="rounded-xl p-4" style={{ background: "rgba(58,111,201,0.04)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <span className="text-xs font-mono text-dim tracking-widest">TODAY'S FOCUS</span>
                </div>
                {totalActiveTasks > 3 && (
                  <Link href="/tasks" className="text-[10px] text-faint hover:text-accent transition-colors">
                    +{totalActiveTasks - 3} 件 →
                  </Link>
                )}
              </div>

              <div className="space-y-2.5">
                {focusTasks.map((task, i) => (
                  <div key={task.id}>
                    {i > 0 && <div className="h-px" style={{ background: "var(--border)" }} />}
                    <div className={`flex items-start gap-3 ${i > 0 ? "pt-2.5" : ""}`}>
                      <TaskCheckbox taskId={task.id} completed={task.completed} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          {task.priority === "HIGH" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "var(--red)" }}>HIGH</span>
                          )}
                          {task.project && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: `${task.project.color}18`, color: task.project.color }}>
                              {task.project.name}
                            </span>
                          )}
                        </div>
                        <Link href={`/tasks/${task.id}`} className="text-sm leading-snug hover:text-accent transition-colors">
                          {task.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-faint flex-wrap">
                <span>→</span>
                {earningPct < 100 && (
                  <Link href="/cases" className="flex items-center gap-1 hover:text-amber-400 transition-colors" style={{ color: "var(--amber)" }}>
                    <Briefcase size={10} />
                    <span>100万円 {earningPct}%</span>
                  </Link>
                )}
                {dreamTotal > 0 && (
                  <Link href="/dreams" className="flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: "#8b5cf6" }}>
                    <Layers size={10} />
                    <span>百層世界 {dreamTotal}層</span>
                  </Link>
                )}
                <span>に繋がる</span>
              </div>
            </div>
          </div>
        )
      })()}


      <div className="px-4 pb-8 md:px-8 lg:px-10 xl:px-16 lg:pb-14 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <DashCard icon={<CheckSquare size={14} strokeWidth={1.5} />} title="タスク" href="/tasks" delay="delay-150">
          {tasks.length === 0 ? (
            <EmptySlate text="今日のタスクはありません" href="/tasks" cta="+ タスクを追加" />
          ) : (
            <ul className="space-y-px">
              {tasks.map((task: any) => {
                const due = task.dueDate ? startOfDay(new Date(task.dueDate)) : null
                const overdue = due && !task.completed && isPast(due) && !isToday(due)
                const dueToday = due && !task.completed && isToday(due)
                return (
                  <li key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--faint)] transition-colors group/task"
                    style={task.priority === "HIGH" && !task.completed ? { borderLeft: "2px solid var(--red)" } : {}}>
                    <TaskCheckbox taskId={task.id} completed={task.completed} />
                    {task.project && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: task.project.color }} />
                    )}
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex-1 text-sm leading-snug hover:text-accent transition-colors"
                      style={{ textDecoration: task.completed ? "line-through" : "none", opacity: task.completed ? 0.5 : 1 }}
                    >
                      {task.title}
                    </Link>
                    {(overdue || dueToday) && (
                      <span className="flex items-center gap-0.5 text-[10px] font-mono shrink-0"
                        style={{ color: overdue ? "var(--red)" : "var(--amber)" }}>
                        <Clock size={9} />
                        {overdue ? "超過" : "今日"}
                      </span>
                    )}
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColor[task.priority] }} />
                  </li>
                )
              })}
            </ul>
          )}
        </DashCard>

        <DashCard icon={<Repeat2 size={14} strokeWidth={1.5} />} title="習慣" href="/habits" delay="delay-150">
          {habits.length === 0 ? (
            <EmptySlate text="習慣を追加しましょう" href="/habits" cta="+ 習慣を設定" />
          ) : (
            <ul className="space-y-px">
              {habits.map((habit: any) => {
                const doneToday = habit.logs.some((l: any) => l.date === todayStr)
                const streak = calcStreak(habit.logs.map((l: any) => l.date))
                return (
                  <li key={habit.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--faint)] transition-all"
                    style={{ opacity: doneToday ? 0.5 : 1 }}>
                    <HabitCheckButton habitId={habit.id} doneToday={doneToday} color={habit.color} />
                    <span className="flex-1 text-sm" style={{ textDecoration: doneToday ? "line-through" : "none" }}>{habit.name}</span>
                    {streak > 0 && <span className="text-xs font-mono shrink-0" style={{ color: habit.color }}>🌧{streak}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </DashCard>

        {/* 進行中の案件 */}
        {cases.filter((c: any) => ["DEVELOPING", "DELIVERED", "WAITING_PAY"].includes(c.status)).length > 0 && (
          <DashCard icon={<Briefcase size={14} strokeWidth={1.5} />} title="進行中の案件" href="/cases" delay="delay-200">
            <ul className="space-y-px">
              {cases.filter((c: any) => ["DEVELOPING", "DELIVERED", "WAITING_PAY"].includes(c.status)).slice(0, 4).map((c: any) => {
                const statusColor: Record<string, string> = { DEVELOPING: "#3a6fc9", DELIVERED: "#8b5cf6", WAITING_PAY: "#f59e0b" }
                const statusLabel: Record<string, string> = { DEVELOPING: "開発中", DELIVERED: "納品済", WAITING_PAY: "支払待" }
                return (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--faint)] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor[c.status] }} />
                    <span className="flex-1 text-sm leading-snug truncate">{c.name}</span>
                    {c.dueDate && (() => {
                      const days = Math.ceil((startOfDay(new Date(c.dueDate)).getTime() - startOfDay(new Date()).getTime()) / 86400000)
                      const col = days < 0 ? "var(--red)" : days <= 3 ? "var(--amber)" : "var(--faint)"
                      return <span className="text-[10px] font-mono shrink-0" style={{ color: col }}>{days < 0 ? `${Math.abs(days)}d超` : days === 0 ? "今日" : `${days}d`}</span>
                    })()}
                    <span className="text-[10px] font-mono text-dim shrink-0">¥{c.reward.toLocaleString()}</span>
                  </li>
                )
              })}
            </ul>
          </DashCard>
        )}

        <div className="lg:col-span-2 xl:col-span-3 animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-accent">
              <BookOpen size={14} strokeWidth={1.5} />
              <span className="text-xs font-medium">日記</span>
              {/* 今日の記録状況インジケーター */}
              {(() => {
                const todayEntry = recentDiaries.find((e: any) => e.date === todayStr)
                if (todayEntry) {
                  return (
                    <Link href={`/diary?date=${todayStr}`}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "rgba(74,222,128,0.1)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.25)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      今日記録済み
                    </Link>
                  )
                }
                return (
                  <Link href={`/diary?date=${todayStr}`}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-opacity hover:opacity-80"
                    style={{ background: "rgba(58,111,201,0.08)", color: "var(--dim)", border: "1px solid var(--border)" }}>
                    今日を書く →
                  </Link>
                )
              })()}
            </div>
            <Link href="/diary" className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors">
              すべて <ArrowRight size={11} />
            </Link>
          </div>
          {recentDiaries.length === 0 ? (
            <div className="surface rounded-xl py-10 text-center">
              <div className="text-2xl mb-2 opacity-25">✍️</div>
              <p className="text-sm text-faint mb-3">まだ日記がありません</p>
              <Link href="/diary" className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                style={{ background: "rgba(58,111,201,0.1)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.2)" }}>
                今日から書く
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentDiaries.map((entry: any) => {
                const moodColors: Record<number, string> = { 1: "#f87171", 2: "#fb923c", 3: "#94a3b8", 4: "#34d399", 5: "#3a6fc9" }
                return (
                  <Link key={entry.id} href={`/diary?date=${entry.date}`}
                    className="surface-hover block p-4 rounded-xl relative"
                    style={entry.date === todayStr ? { borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.04)" } : {}}>
                    {entry.date === todayStr && (
                      <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-green-400" />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-mono"
                        style={{ color: entry.date === todayStr ? "var(--green)" : "var(--dim)" }}>
                        {entry.date === todayStr ? "今日" : formatDisplay(entry.date)}
                      </p>
                      {entry.mood && (
                        <span className="text-sm" title={["","最悪","悪い","普通","良い","最高"][entry.mood]}>
                          {["","😞","😕","😐","🙂","😄"][entry.mood]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-1 mb-1">{entry.title}</p>
                    <p className="text-xs text-dim line-clamp-2">{entry.content}</p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ value, label, color, href }: { value: string | number; label: string; color: string; href?: string }) {
  const inner = (
    <>
      <span className="font-mono font-medium" style={{ color }}>{value}</span>
      <span style={{ color: "var(--dim)" }}>{label}</span>
    </>
  )
  const cls = "flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs animate-pop-in transition-all hover:border-[var(--border-h)]"
  const style = { background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }
  if (href) {
    return (
      <Link href={href} className={cls + " hover:opacity-80"} style={style}>
        {inner}
      </Link>
    )
  }
  return <div className={cls} style={style}>{inner}</div>
}

function DashCard({ icon, title, href, children, delay = "" }: { icon: React.ReactNode; title: string; href: string; children: React.ReactNode; delay?: string }) {
  return (
    <div className={`surface-hover rounded-xl overflow-hidden animate-fade-in ${delay}`}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-accent">{icon}<span className="text-xs font-medium">{title}</span></div>
        <Link href={href} className="flex items-center gap-1.5 text-xs text-dim hover:text-accent transition-colors px-2 py-1 rounded-md hover:bg-[var(--faint)]">
          すべて <ArrowRight size={11} />
        </Link>
      </div>
      <div className="p-3 min-h-[120px]">{children}</div>
    </div>
  )
}

const EMPTY_ICONS: Record<string, string> = {
  "今日のタスクはありません": "☁",
  "習慣を追加しましょう": "🌱",
}

function EmptySlate({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  const icon = EMPTY_ICONS[text] ?? "🌧"
  return (
    <div className="text-center py-8">
      <div className="text-2xl mb-2 opacity-30">{icon}</div>
      <p className="text-xs text-faint mb-4">{text}</p>
      {href && cta && (
        <Link href={href} className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80 inline-flex items-center gap-1"
          style={{ background: "rgba(58,111,201,0.1)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.2)" }}>
          {cta}
        </Link>
      )}
    </div>
  )
}
