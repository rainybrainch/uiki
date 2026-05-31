import { prisma } from "@/lib/db"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskList } from "@/components/tasks/TaskList"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import { ViewToggle } from "@/components/tasks/ViewToggle"
import { ProjectSidebar } from "@/components/tasks/ProjectSidebar"
import { CheckSquare, AlertCircle, Sun, Calendar, Layers } from "lucide-react"
import { format, isToday, isTomorrow, isThisWeek, isPast, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"

export const dynamic = "force-dynamic"

const COLUMNS = [
  { id: "todo",  label: "未着手" },
  { id: "doing", label: "進行中" },
  { id: "done",  label: "完了"   },
]

type View = "all" | "today" | "upcoming" | "overdue" | "board"
type Filter = "all" | string  // "all" or projectId

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; project?: string }>
}) {
  const params = await searchParams
  const view = (params.view ?? "all") as View
  const projectFilter = params.project ?? "all"

  let allTasks: any[] = []
  let projects: any[] = []
  try {
    ;[allTasks, projects] = await Promise.all([
      prisma.task.findMany({
        include: {
          subtasks: { orderBy: { order: "asc" } },
          project: { select: { id: true, name: true, color: true } },
        },
        where: {
          ...(projectFilter !== "all" ? { projectId: projectFilter } : {}),
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.project.findMany({
        where: { archived: false },
        orderBy: { order: "asc" },
        include: { _count: { select: { tasks: { where: { completed: false } } } } },
      }),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }

  const now = new Date()
  const todayStart = startOfDay(now)

  const active = allTasks.filter((t) => !t.completed)
  const done   = allTasks.filter((t) => t.completed)

  // スマートリスト
  const todayTasks    = active.filter((t) => t.dueDate && isToday(new Date(t.dueDate)))
  const overdueTasks  = active.filter((t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)))
  const upcomingTasks = active.filter((t) => t.dueDate && !isToday(new Date(t.dueDate)) && !isPast(new Date(t.dueDate)))
  const noDateTasks   = active.filter((t) => !t.dueDate)

  const smartViews = [
    { id: "all",      label: "すべて",   icon: Layers,       count: active.length },
    { id: "today",    label: "今日",     icon: Sun,          count: todayTasks.length + overdueTasks.length },
    { id: "upcoming", label: "今後",     icon: Calendar,     count: upcomingTasks.length },
    { id: "overdue",  label: "期限切れ", icon: AlertCircle,  count: overdueTasks.length },
    { id: "board",    label: "ボード",   icon: CheckSquare,  count: null },
  ]

  // 表示するタスクを決定
  const displayTasks: typeof allTasks = view === "today"
    ? [...overdueTasks, ...todayTasks]
    : view === "upcoming"
    ? upcomingTasks
    : view === "overdue"
    ? overdueTasks
    : active

  // プロジェクトでグループ化（all ビュー）
  const grouped = view === "all" && projectFilter === "all"
    ? groupByProject(displayTasks, projects)
    : null

  return (
    <div className="h-full flex">
      {/* プロジェクトサイドバー */}
      <ProjectSidebar
        projects={projects}
        currentProject={projectFilter}
        currentView={view}
        smartViews={smartViews}
      />

      {/* メインエリア */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-7 py-7 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-serif font-light tracking-wide">
              {view === "today"    ? "今日" :
               view === "upcoming" ? "今後7日" :
               view === "overdue"  ? "期限切れ" :
               view === "board"    ? "ボード" :
               projectFilter !== "all"
                ? projects.find((p) => p.id === projectFilter)?.name ?? "タスク"
                : "すべて"}
            </h1>
            <span className="text-xs font-mono text-dim">{active.length} 件</span>
          </div>
          <ViewToggle current={view} projectFilter={projectFilter} />
        </div>

        {/* タスク追加フォーム */}
        <div className="px-7 pb-4 shrink-0">
          <TaskForm
            compact={view === "board"}
            projects={projects}
            defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
          />
        </div>

        {/* コンテンツ */}
        {view === "board" ? (
          <div className="flex-1 overflow-hidden px-7 pb-6">
            <KanbanBoard columns={COLUMNS} tasks={allTasks} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-7 pb-10">
            {view === "today" && overdueTasks.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={13} style={{ color: "var(--red)" }} />
                  <p className="text-xs font-medium" style={{ color: "var(--red)" }}>
                    期限切れ — {overdueTasks.length}件
                  </p>
                </div>
                <TaskList tasks={overdueTasks} />
              </section>
            )}

            {/* プロジェクトグループ表示 */}
            {grouped ? (
              grouped.map(({ project, tasks }) => (
                <section key={project?.id ?? "none"} className="mb-8">
                  {project && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                      <Link
                        href={`/tasks?view=all&project=${project.id}`}
                        className="text-xs font-medium text-dim hover:text-white transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className="text-[10px] text-faint">{tasks.length}</span>
                    </div>
                  )}
                  {!project && tasks.length > 0 && (
                    <p className="text-xs text-faint mb-3">未分類</p>
                  )}
                  <TaskList tasks={tasks} />
                </section>
              ))
            ) : (
              <TaskList tasks={displayTasks} />
            )}

            {/* 完了済み（all/project のみ） */}
            {(view === "all" && done.length > 0) && (
              <section className="mt-10 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs text-faint mb-3">完了 — {done.length}件</p>
                <TaskList tasks={done} dimmed />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function groupByProject(
  tasks: any[],
  projects: any[]
) {
  const groups: { project: any; tasks: any[] }[] = []

  // プロジェクトあり
  for (const project of projects) {
    const t = tasks.filter((task) => task.projectId === project.id)
    if (t.length > 0) groups.push({ project, tasks: t })
  }

  // 未分類
  const noProject = tasks.filter((t) => !t.projectId)
  if (noProject.length > 0) groups.push({ project: null, tasks: noProject })

  return groups
}
