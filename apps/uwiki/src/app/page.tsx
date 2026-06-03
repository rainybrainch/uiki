import { prisma } from "@/lib/db"
import { today, calcStreak, formatDisplay } from "@/lib/date"
import { format, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import { CheckSquare, Repeat2, BookOpen, ArrowRight, AlertCircle, Briefcase, Layers } from "lucide-react"
import Link from "next/link"
import { TaskCheckbox } from "@/components/tasks/TaskCheckbox"
import { HabitCheckButton } from "@/components/habits/HabitCheckButton"
import { QuickAddTask } from "@/components/dashboard/QuickAddTask"

export const dynamic = "force-dynamic"

const GOAL_100MAN = 1_000_000

export default async function DashboardPage() {
  const todayStr = today()

  let tasks: any[] = []
  let habits: any[] = []
  let recentDiaries: any[] = []
  let doneTasks = 0
  let overdueCount = 0
  let cases: any[] = []
  let dreams: any[] = []

  try {
    ;[tasks, habits, recentDiaries, doneTasks, overdueCount, cases, dreams] = await Promise.all([
      prisma.task.findMany({
        where: { completed: false },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
        include: { project: { select: { id: true, name: true, color: true } } },
        take: 6,
      }),
      prisma.habit.findMany({
        include: { logs: { orderBy: { date: "desc" }, take: 30 } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.diaryEntry.findMany({ orderBy: { date: "desc" }, take: 3 }),
      prisma.task.count({ where: { completed: true } }),
      prisma.task.count({
        where: {
          completed: false,
          dueDate: { lt: startOfDay(new Date()) },
        },
      }),
      prisma.case.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.dream.findMany({ orderBy: [{ achieved: "asc" }, { layer: "asc" }] }),
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
  const dreamPct = Math.round((dreamAchieved / 100) * 100)

  const priorityColor: Record<string, string> = {
    HIGH: "var(--red)", MEDIUM: "var(--accent)", LOW: "var(--dim)",
  }

  return (
    <div className="min-h-screen">
      <section className="px-4 pt-8 pb-6 md:px-8 md:pt-12 md:pb-8 lg:px-10 lg:pt-14 animate-fade-in">
        <p className="text-xs font-mono tracking-widest mb-3 text-dim">
          {format(new Date(), "yyyy / MM / dd  E", { locale: ja })}
        </p>
        <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light tracking-wider leading-none mb-1">
          おかえり
        </h1>
        <p className="text-sm text-dim mt-2">今日も雨が降っている。</p>

        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <StatPill value={tasks.length} label="未完了タスク" color="var(--accent)" />
          <StatPill value={`${doneHabitsToday} / ${habits.length}`} label="今日の習慣" color="var(--green)" />
          <StatPill value={doneTasks} label="完了済み" color="var(--dim)" />
          {overdueCount > 0 && (
            <a href="/tasks?view=overdue" className="flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-opacity hover:opacity-80" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <AlertCircle size={12} style={{ color: "var(--red)" }} />
              <span className="font-mono font-medium text-sm" style={{ color: "var(--red)" }}>{overdueCount}</span>
              <span style={{ color: "rgba(248,113,113,0.8)" }}>期限切れ</span>
            </a>
          )}
        </div>

        {/* 大目標ウィジェット */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {/* 100万円 */}
          <Link href="/cases" className="rounded-xl p-4 transition-opacity hover:opacity-80 block"
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
              <div className="h-full rounded-full" style={{ width: `${earningPct}%`, background: "var(--amber)" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">{earningPct}%{pending > 0 && ` · 待ち ¥${pending.toLocaleString()}`}</p>
          </Link>

          {/* 百層世界 */}
          <Link href="/dreams" className="rounded-xl p-4 transition-opacity hover:opacity-80 block"
            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={12} style={{ color: "#8b5cf6" }} />
              <span className="text-xs text-dim">百層世界</span>
            </div>
            <p className="text-xl font-serif font-light mb-2" style={{ color: "#8b5cf6" }}>
              {dreamAchieved}
              <span className="text-xs text-dim ml-1">/ 100層</span>
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: `${(dreamTotal / 100) * 100}%`, background: "rgba(139,92,246,0.3)" }} />
              <div className="h-full rounded-full -mt-1.5" style={{ width: `${dreamPct}%`, background: "#8b5cf6" }} />
            </div>
            <p className="text-xs font-mono text-dim mt-1">{dreamTotal}層入力 · {dreamAchieved}層達成</p>
          </Link>
        </div>
      </section>

      {/* 今日のフォーカス — タスクと大目標の接続 */}
      {tasks.length > 0 && (
        <div className="px-4 pb-4 md:px-8 lg:px-10 animate-fade-in delay-100">
          <div className="rounded-xl p-4" style={{ background: "rgba(58,111,201,0.04)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-xs font-mono text-dim tracking-widest">TODAY'S FOCUS</span>
            </div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {tasks[0].project && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${tasks[0].project.color}22`, color: tasks[0].project.color, border: `1px solid ${tasks[0].project.color}44` }}>
                  {tasks[0].project.name}
                </span>
              )}
              {tasks[0].priority === "HIGH" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.15)", color: "var(--red)" }}>優先</span>
              )}
            </div>
            <p className="text-sm font-medium mb-1 leading-snug">{tasks[0].title}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-faint flex-wrap">
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
      )}

      {/* クイックタスク追加 */}
      <div className="px-4 pb-4 md:px-8 lg:px-10 animate-fade-in delay-100">
        <QuickAddTask />
      </div>

      <div className="px-4 pb-8 md:px-8 lg:px-10 lg:pb-14 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashCard icon={<CheckSquare size={14} strokeWidth={1.5} />} title="タスク" href="/tasks" delay="delay-150">
          {tasks.length === 0 ? (
            <EmptySlate text="今日のタスクはありません" href="/tasks" cta="+ タスクを追加" />
          ) : (
            <ul className="space-y-px">
              {tasks.map((task: any) => (
                <li key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--faint)] transition-colors">
                  <TaskCheckbox taskId={task.id} completed={task.completed} />
                  <span className="flex-1 text-sm leading-snug">{task.title}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: priorityColor[task.priority] }} />
                </li>
              ))}
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
                  <li key={habit.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--faint)] transition-colors">
                    <HabitCheckButton habitId={habit.id} doneToday={doneToday} color={habit.color} />
                    <span className="flex-1 text-sm">{habit.name}</span>
                    {streak > 0 && <span className="text-xs font-mono" style={{ color: habit.color }}>{streak}日</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </DashCard>

        <div className="lg:col-span-2 animate-fade-in delay-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-accent">
              <BookOpen size={14} strokeWidth={1.5} />
              <span className="text-xs font-medium">日記</span>
            </div>
            <Link href="/diary" className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors">
              すべて <ArrowRight size={11} />
            </Link>
          </div>
          {recentDiaries.length === 0 ? (
            <div className="surface rounded-xl py-12 text-center">
              <p className="text-sm text-faint">まだ日記がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentDiaries.map((entry: any) => (
                <Link key={entry.id} href={`/diary?date=${entry.date}`} className="surface-hover block p-4 rounded-xl">
                  <p className="text-[10px] font-mono mb-2 text-dim">{formatDisplay(entry.date)}</p>
                  <p className="text-sm font-medium line-clamp-1 mb-1">{entry.title}</p>
                  <p className="text-xs text-dim line-clamp-2">{entry.content}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
      <span className="font-mono font-medium text-sm" style={{ color }}>{value}</span>
      <span style={{ color: "var(--dim)" }}>{label}</span>
    </div>
  )
}

function DashCard({ icon, title, href, children, delay = "" }: { icon: React.ReactNode; title: string; href: string; children: React.ReactNode; delay?: string }) {
  return (
    <div className={`surface rounded-xl overflow-hidden animate-fade-in ${delay}`}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-accent">{icon}<span className="text-xs font-medium">{title}</span></div>
        <Link href={href} className="flex items-center gap-1 text-xs text-dim hover:text-accent transition-colors">
          すべて <ArrowRight size={11} />
        </Link>
      </div>
      <div className="p-2">{children}</div>
    </div>
  )
}

function EmptySlate({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-faint mb-3">{text}</p>
      {href && cta && (
        <Link href={href} className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "rgba(58,111,201,0.12)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.2)" }}>
          {cta}
        </Link>
      )}
    </div>
  )
}
