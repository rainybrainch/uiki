import { prisma } from "@/lib/db"
import type { Task, SubTask, Project } from "@uwiki/database"
import { TaskForm } from "@/components/tasks/TaskForm"
import { TaskList } from "@/components/tasks/TaskList"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import { ViewToggle } from "@/components/tasks/ViewToggle"
import { ProjectSidebar } from "@/components/tasks/ProjectSidebar"
import { DoneSection } from "@/components/tasks/DoneSection"
import { BulkAddTasks } from "@/components/tasks/BulkAddTasks"
import { FlowView } from "@/components/tasks/FlowView"
import { AlertCircle } from "lucide-react"
import { format, isToday, isTomorrow, isPast, startOfDay, differenceInCalendarDays } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"

export const dynamic = "force-dynamic"

const COLUMNS = [
  { id: "todo",  label: "未着手" },
  { id: "doing", label: "進行中" },
  { id: "done",  label: "完了"   },
]

type View = "all" | "today" | "upcoming" | "overdue" | "board" | "flow"
type Filter = "all" | string
export type SmartViewDef = { id: string; label: string; count: number | null }

type TaskWithRelations = Task & {
  subtasks: SubTask[]
  project: { id: string; name: string; color: string } | null
}
type ProjectWithCount = Project & { _count: { tasks: number } }
type TaskNode = Task & { children: TaskNode[] }

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; project?: string; tag?: string }>
}) {
  const params = await searchParams
  const view = (params.view ?? "today") as View
  const projectFilter = params.project ?? "all"
  const tagFilter = params.tag ?? ""

  let allTasks: TaskWithRelations[] = []
  let projects: ProjectWithCount[] = []
  let flowRoots: TaskNode[] = []
  let flowDreamTitle: string | undefined
  let flowTaskCount = 0
  const projectWhere = {
    ...(projectFilter !== "all" ? { projectId: projectFilter } : {}),
    // CSVタグの正確なマッチ（"重要" が "超重要" にマッチしないよう前後のカンマも考慮）
    ...(tagFilter ? {
      OR: [
        { tags: { equals: tagFilter } },
        { tags: { startsWith: `${tagFilter},` } },
        { tags: { endsWith: `,${tagFilter}` } },
        { tags: { contains: `,${tagFilter},` } },
      ]
    } : {}),
  }

  try {
    if (view === "flow") {
      // フロービュー: root タスク一覧とプロジェクト一覧のみ取得
      const [allFlowTasks, projs] = await Promise.all([
        prisma.task.findMany({
          where: { ...projectWhere },
          orderBy: [{ depth: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        }),
        prisma.project.findMany({
          where: { archived: false },
          orderBy: { order: "asc" },
          include: { _count: { select: { tasks: { where: { completed: false, parentTaskId: null } } } } },
        }),
      ])
      projects = projs
      flowRoots = buildTree(allFlowTasks.filter((t) => t.parentTaskId === null), allFlowTasks)
      flowTaskCount = allFlowTasks.length

      const anyDreamId = allFlowTasks.find((t) => t.dreamId)?.dreamId
      if (anyDreamId) {
        const dream = await prisma.dream.findUnique({ where: { id: anyDreamId }, select: { title: true } })
        flowDreamTitle = dream?.title
      }
    } else {
      // リスト・ボードビュー: 子タスクを除外して取得
      const [tasks, projs, flowCount] = await Promise.all([
        prisma.task.findMany({
          include: {
            subtasks: { orderBy: { order: "asc" } },
            project: { select: { id: true, name: true, color: true } },
          },
          where: { ...projectWhere, parentTaskId: null },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        }),
        prisma.project.findMany({
          where: { archived: false },
          orderBy: { order: "asc" },
          include: { _count: { select: { tasks: { where: { completed: false, parentTaskId: null } } } } },
        }),
        prisma.task.count({ where: { ...projectWhere, parentTaskId: { not: null } } }),
      ])
      allTasks = tasks
      projects = projs
      flowTaskCount = flowCount
    }
  } catch {
    // DB未接続時はデフォルト値
  }

  const now = new Date()
  const todayStart = startOfDay(now)

  // フロービュー以外では allTasks は既に parentTaskId=null 済み
  const flatTasks = allTasks
  const active = flatTasks.filter((t) => !t.completed)
  const done   = flatTasks.filter((t) => t.completed)

  // スマートリスト（startOfDay でタイムゾーン境界を正規化）
  const todayTasks    = active.filter((t) => t.dueDate && isToday(startOfDay(new Date(t.dueDate))))
  const overdueTasks  = active.filter((t) => t.dueDate && isPast(startOfDay(new Date(t.dueDate))) && !isToday(startOfDay(new Date(t.dueDate))))
  const upcomingTasks = active.filter((t) => t.dueDate && !isToday(startOfDay(new Date(t.dueDate))) && !isPast(startOfDay(new Date(t.dueDate))))

  const smartViews: SmartViewDef[] = [
    { id: "all",      label: "すべて",   count: active.length },
    { id: "today",    label: "今日",     count: todayTasks.length + overdueTasks.length },
    { id: "upcoming", label: "今後",     count: upcomingTasks.length },
    { id: "overdue",  label: "期限切れ", count: overdueTasks.length },
    { id: "board",    label: "ボード",   count: null },
    { id: "flow",     label: "フロー",   count: flowTaskCount > 0 ? flowTaskCount : null },
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
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden max-w-[1100px]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-4 md:px-7 md:py-5 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-serif font-light tracking-wide">
              {view === "today"    ? "今日" :
               view === "upcoming" ? "今後7日" :
               view === "overdue"  ? "期限切れ" :
               view === "board"    ? "ボード" :
               projectFilter !== "all"
                ? projects.find((p) => p.id === projectFilter)?.name ?? "タスク"
                : "すべて"}
            </h1>
            <span className="text-xs font-mono text-dim">
              {view === "board" || view === "flow" ? active.length : displayTasks.length} 件
            </span>
            {view !== "board" && view !== "flow" && displayTasks.length !== active.length && (
              <span className="text-[10px] font-mono text-faint">全 {active.length}</span>
            )}
            {view === "all" && done.length > 0 && (
              <span className="text-[10px] font-mono text-faint">完了 {done.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <BulkAddTasks projectId={projectFilter !== "all" ? projectFilter : undefined} />
            <ViewToggle current={view} projectFilter={projectFilter} />
          </div>
        </div>

        {/* モバイル: スマートビュー切り替え（sm未満のみ表示） */}
        <div className="flex gap-1.5 px-4 pb-1.5 overflow-x-auto sm:hidden shrink-0 scrollbar-hide">
          {smartViews.map(({ id, label, count }) => (
            <a key={id} href={`/tasks?view=${id}${projectFilter !== "all" ? `&project=${projectFilter}` : ""}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs shrink-0 transition-all"
              style={{
                background: view === id ? "rgba(58,111,201,0.18)" : "var(--faint)",
                border: `1px solid ${view === id ? "rgba(58,111,201,0.35)" : "transparent"}`,
                color: view === id ? "white" : "var(--dim)",
              }}>
              {label}
              {count !== null && count > 0 && (
                <span className="font-mono" style={{ color: view === id ? "var(--accent)" : "var(--faint)" }}>{count}</span>
              )}
            </a>
          ))}
        </div>

        {/* モバイル: プロジェクトチップ行（sm未満のみ表示） */}
        {projects.length > 0 && (
          <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto sm:hidden shrink-0 scrollbar-hide">
            <a href={`/tasks?view=${view}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] shrink-0 transition-all"
              style={{
                background: projectFilter === "all" ? "rgba(255,255,255,0.1)" : "var(--faint)",
                border: `1px solid ${projectFilter === "all" ? "rgba(255,255,255,0.25)" : "transparent"}`,
                color: projectFilter === "all" ? "white" : "var(--dim)",
              }}>
              全部
            </a>
            {projects.map((p) => (
              <a key={p.id} href={`/tasks?view=${view}&project=${p.id}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] shrink-0 transition-all"
                style={{
                  background: projectFilter === p.id ? `${p.color}22` : "var(--faint)",
                  border: `1px solid ${projectFilter === p.id ? `${p.color}55` : "transparent"}`,
                  color: projectFilter === p.id ? p.color : "var(--dim)",
                }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
                {p.name}
                {p._count.tasks > 0 && (
                  <span className="font-mono text-[10px]" style={{ color: projectFilter === p.id ? p.color : "var(--faint)" }}>
                    {p._count.tasks}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* アクティブタグフィルターバー */}
        {tagFilter && (
          <div className="px-4 pb-2 md:px-7 shrink-0 flex items-center gap-2">
            <span className="text-[10px] text-dim">タグ絞り込み:</span>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(58,111,201,0.15)", color: "var(--accent)", border: "1px solid rgba(58,111,201,0.3)" }}>
              #{tagFilter}
              <Link
                href={`/tasks?view=${view}${projectFilter !== "all" ? `&project=${projectFilter}` : ""}`}
                className="text-dim hover:text-white transition-colors ml-0.5 hover:opacity-80"
                aria-label={`タグ「${tagFilter}」のフィルターを解除`}
              >
                ×
              </Link>
            </span>
            <span className="text-[10px] text-faint">{active.length} 件</span>
          </div>
        )}

        {/* タスク追加フォーム */}
        <div className="px-4 pb-3 md:px-7 md:pb-4 shrink-0">
          <TaskForm
            compact={view === "board"}
            projects={projects}
            defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
          />
        </div>

        {/* コンテンツ */}
        {view === "board" ? (
          <div className="flex-1 overflow-hidden px-4 pb-4 md:px-7 md:pb-6">
            <KanbanBoard columns={COLUMNS} tasks={allTasks} />
          </div>
        ) : view === "flow" ? (
          <div className="flex-1 overflow-y-auto px-4 pb-6 md:px-7 md:pb-10">
            <FlowView
              roots={flowRoots}
              dreamTitle={flowDreamTitle}
              projectId={projectFilter !== "all" ? projectFilter : undefined}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-6 md:px-7 md:pb-10">
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
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: project.color }} />
                      <Link
                        href={`/tasks?view=all&project=${project.id}`}
                        className="text-xs font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: project.color }}
                      >
                        {project.name}
                      </Link>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{ background: `${project.color}15`, color: project.color }}>
                        {tasks.length}
                      </span>
                    </div>
                  )}
                  {!project && tasks.length > 0 && (
                    <p className="text-xs text-faint mb-3">未分類</p>
                  )}
                  <TaskList tasks={tasks} />
                </section>
              ))
            ) : view === "upcoming" ? (
              /* 今後7日ビュー — 日付別グループ */
              (() => {
                const groups = new Map<string, typeof displayTasks>()
                for (const t of displayTasks) {
                  const d = t.dueDate ? format(startOfDay(new Date(t.dueDate)), "yyyy-MM-dd") : "未設定"
                  if (!groups.has(d)) groups.set(d, [])
                  groups.get(d)!.push(t)
                }
                return Array.from(groups.entries()).map(([dateKey, tasks]) => {
                  const label = dateKey === "未設定" ? "期限未設定" :
                    isToday(new Date(dateKey)) ? "今日" :
                    isTomorrow(new Date(dateKey)) ? "明日" :
                    `${differenceInCalendarDays(new Date(dateKey), new Date())}日後（${format(new Date(dateKey), "M/d")}）`
                  return (
                    <section key={dateKey} className="mb-6">
                      <p className="text-xs font-mono mb-2 px-1"
                        style={{ color: isToday(new Date(dateKey)) ? "var(--accent)" : "var(--dim)" }}>
                        {label}
                      </p>
                      <TaskList tasks={tasks} />
                    </section>
                  )
                })
              })()
            ) : (
              <TaskList tasks={displayTasks} />
            )}

            {/* 完了済み（all/project ビューのみ）— クライアント折りたたみ */}
            {view === "all" && done.length > 0 && (
              <DoneSection
                tasks={done}
                count={done.length}
                projectId={projectFilter !== "all" ? projectFilter : undefined}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function groupByProject(
  tasks: TaskWithRelations[],
  projects: ProjectWithCount[]
): { project: ProjectWithCount | null; tasks: TaskWithRelations[] }[] {
  const groups: { project: ProjectWithCount | null; tasks: TaskWithRelations[] }[] = []

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

function buildTree(roots: Task[], all: Task[]): TaskNode[] {
  return roots.map((node) => ({
    ...node,
    children: buildTree(
      all.filter((t) => t.parentTaskId === node.id),
      all
    ),
  }))
}
