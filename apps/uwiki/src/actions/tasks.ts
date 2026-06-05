"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { Priority } from "@uwiki/database"
export type { Priority }
import { format, addDays, addWeeks, addMonths, parseISO } from "date-fns"
import { today } from "@/lib/date"

export type KanbanColumn = "todo" | "doing" | "done"
export type Recurrence = "daily" | "weekly" | "monthly"

function nextRecurrence(from: string, rec: Recurrence): string {
  const d = parseISO(from)
  if (rec === "daily")   return format(addDays(d, 1), "yyyy-MM-dd")
  if (rec === "weekly")  return format(addWeeks(d, 1), "yyyy-MM-dd")
  return format(addMonths(d, 1), "yyyy-MM-dd")
}

export async function createTask(data: {
  title: string
  memo?: string
  priority?: Priority
  dueDate?: string
  column?: KanbanColumn
  tags?: string
  recurrence?: Recurrence
  projectId?: string
  parentTaskId?: string
  depth?: number
  dreamId?: string
}) {
  await prisma.task.create({
    data: {
      title: data.title,
      memo: data.memo,
      priority: data.priority ?? "MEDIUM",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      column: data.column ?? "todo",
      tags: data.tags,
      recurrence: data.recurrence,
      recNextDate: data.recurrence ? nextRecurrence(today(), data.recurrence) : null,
      projectId: data.projectId,
      parentTaskId: data.parentTaskId,
      depth: data.depth ?? 0,
      dreamId: data.dreamId,
      completed: false,
    },
  })
  revalidatePath("/tasks")
  revalidatePath("/")
}

/** 繰り返しタスクを完了したとき次インスタンスを生成 */
export async function completeRecurringTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task || !task.recurrence) return

  // 現タスクを完了
  await prisma.task.update({ where: { id }, data: { completed: true, column: "done" } })

  // 次のタスクを生成（元タスクのrecNextDate or dueDateを基準にする）
  const baseDate = task.recNextDate
    ?? (task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : today())
  const nextDate = nextRecurrence(baseDate, task.recurrence as Recurrence)
  await prisma.task.create({
    data: {
      title: task.title,
      memo: task.memo,
      priority: task.priority,
      dueDate: new Date(nextDate),
      column: "todo",
      tags: task.tags,
      recurrence: task.recurrence,
      recNextDate: nextRecurrence(nextDate, task.recurrence as Recurrence),
      projectId: task.projectId,
      dreamId: task.dreamId ?? null,
      completed: false,
    },
  })

  // 繰り返し完了時も dream 進捗を同期
  try {
    const dreamId = task.dreamId
      ?? (task.projectId ? await getDreamIdFromProject(task.projectId) : null)
    if (dreamId) await syncDreamProgress(dreamId)
  } catch (e) { console.error("[completeRecurringTask/dreamSync]", e) }

  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function moveTask(id: string, column: KanbanColumn) {
  const completed = column === "done"
  let task: any = null
  try {
    task = await prisma.task.update({
      where: { id },
      data: { column, completed },
    })
  } catch (e) {
    console.error("[moveTask]", e)
    return
  }

  // 「完了」列に移動した場合は toggleTask と同じ進捗ロールアップを実行
  if (completed && task) {
    if (task.parentTaskId) {
      try { await rollupParentProgress(task.parentTaskId) } catch (e) { console.error("[moveTask/rollup]", e) }
    }
    try {
      const dreamId = task.dreamId
        ?? (task.projectId ? await getDreamIdFromProject(task.projectId) : null)
      if (dreamId) await syncDreamProgress(dreamId)
    } catch (e) { console.error("[moveTask/dreamSync]", e) }
  }

  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function toggleTask(id: string, completed: boolean) {
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task) return

  if (completed && task.recurrence) {
    await completeRecurringTask(id)
    return
  }

  try {
    await prisma.task.update({
      where: { id },
      data: { completed, column: completed ? "done" : "todo" },
    })
  } catch (e) {
    console.error("[toggleTask]", e)
    return
  }

  // 親タスクへの進捗ロールアップ
  if (task.parentTaskId) {
    try {
      await rollupParentProgress(task.parentTaskId)
    } catch (e) {
      console.error("[toggleTask/rollup]", e)
    }
  }

  // タスク完了 → 百層世界 progress 自動更新（dreamId直接リンク優先）
  if (completed) {
    try {
      const dreamId = task.dreamId
        ?? (task.projectId ? await getDreamIdFromProject(task.projectId) : null)
      if (dreamId) await syncDreamProgress(dreamId)
    } catch (e) {
      console.error("[toggleTask/dreamSync]", e)
    }
  }

  revalidatePath("/tasks")
  revalidatePath("/")
}

// ─── 内部ヘルパー ───────────────────────────────────────────

async function rollupParentProgress(parentId: string) {
  const siblings = await prisma.task.findMany({ where: { parentTaskId: parentId } })
  if (siblings.length === 0) return
  const doneCount = siblings.filter((s) => s.completed).length
  const progress = Math.round((doneCount / siblings.length) * 100)
  const allDone = doneCount === siblings.length

  await prisma.task.update({
    where: { id: parentId },
    data: { completed: allDone, column: allDone ? "done" : "todo" },
  })

  // さらに上の親があれば再帰的にロールアップ
  const parent = await prisma.task.findUnique({ where: { id: parentId } })
  if (parent?.parentTaskId) await rollupParentProgress(parent.parentTaskId)
  if (parent?.dreamId) await syncDreamProgress(parent.dreamId)
}

async function getDreamIdFromProject(projectId: string): Promise<string | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null
  const dream = await prisma.dream.findFirst({
    where: {
      OR: [
        { title: { contains: project.name } },
        { connections: { contains: project.name } },
      ],
    },
  })
  return dream?.id ?? null
}

async function syncDreamProgress(dreamId: string) {
  const tasks = await prisma.task.findMany({
    where: { dreamId, depth: 0 },
  })
  if (tasks.length === 0) return
  const done = tasks.filter((t) => t.completed).length
  const progress = Math.round((done / tasks.length) * 100)
  await prisma.dream.update({
    where: { id: dreamId },
    data: { progress },
  })
  revalidatePath("/dreams")
}

// ─── フロー一括作成 ──────────────────────────────────────────

export type FlowNode = {
  title: string
  memo?: string
  priority?: Priority
  children?: FlowNode[]
}

export async function createFlow(nodes: FlowNode[], opts: {
  projectId?: string
  dreamId?: string
  parentTaskId?: string
  depth?: number
}) {
  const { projectId, dreamId, parentTaskId, depth = 0 } = opts
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const task = await prisma.task.create({
      data: {
        title: node.title,
        memo: node.memo,
        priority: node.priority ?? "MEDIUM",
        column: "todo",
        completed: false,
        projectId,
        dreamId: depth === 0 ? dreamId : undefined,
        parentTaskId,
        depth,
        order: i,
      },
    })
    if (node.children?.length) {
      await createFlow(node.children, {
        projectId,
        dreamId,
        parentTaskId: task.id,
        depth: depth + 1,
      })
    }
  }
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function createTasksBulk(lines: string[], projectId?: string) {
  const tasks = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      let priority: Priority = "MEDIUM"
      let title = line
      if (line.startsWith("!")) { priority = "HIGH"; title = line.slice(1).trim() }
      else if (line.startsWith("~")) { priority = "LOW"; title = line.slice(1).trim() }
      return { title, priority }
    })
  await prisma.task.createMany({
    data: tasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      column: "todo" as const,
      completed: false,
      projectId: projectId ?? null,
    })),
  })
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function updateTask(
  id: string,
  data: {
    title?: string
    memo?: string
    priority?: Priority
    dueDate?: string | null
    tags?: string
    recurrence?: Recurrence | null
    dreamId?: string | null
  }
) {
  try {
    await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
        recurrence: data.recurrence === null ? null : data.recurrence,
      },
    })
  } catch (e) {
    console.error("[updateTask]", e)
    return
  }
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function deleteAllCompleted(projectId?: string) {
  try {
    await prisma.task.deleteMany({
      where: {
        completed: true,
        parentTaskId: null,
        ...(projectId ? { projectId } : {}),
      },
    })
  } catch (e) {
    console.error("[deleteAllCompleted]", e)
    return
  }
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({ where: { id } })
  } catch (e) {
    console.error("[deleteTask]", e)
    return
  }
  revalidatePath("/tasks")
  revalidatePath("/")
}

// ─── サブタスク ────────────────────────────────────────

export async function createSubTask(taskId: string, title: string) {
  const count = await prisma.subTask.count({ where: { taskId } })
  await prisma.subTask.create({ data: { taskId, title, order: count } })
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function toggleSubTask(id: string, completed: boolean) {
  await prisma.subTask.update({ where: { id }, data: { completed } })
  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function deleteSubTask(id: string) {
  await prisma.subTask.delete({ where: { id } })
  revalidatePath("/tasks")
  revalidatePath("/")
}

// ─── 検索 ────────────────────────────────────────────

export async function searchAll(q: string) {
  if (!q.trim()) return { tasks: [], diary: [], library: [], cases: [], dreams: [] }
  const kw = q.trim()

  const [tasks, diary, library, cases, dreams] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: kw } },
          { memo: { contains: kw } },
          { tags: { contains: kw } },
        ],
        completed: false,
        parentTaskId: null, // フロー子タスクを除外
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.diaryEntry.findMany({
      where: {
        OR: [
          { title: { contains: kw } },
          { content: { contains: kw } },
        ],
      },
      take: 5,
      orderBy: { date: "desc" },
    }),
    prisma.libraryItem.findMany({
      where: {
        OR: [
          { title: { contains: kw } },
          { creator: { contains: kw } },
          { note: { contains: kw } },
          { tags: { contains: kw } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.case.findMany({
      where: {
        OR: [
          { name: { contains: kw } },
          { client: { contains: kw } },
          { memo: { contains: kw } },
        ],
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.dream.findMany({
      where: {
        OR: [
          { title: { contains: kw } },
          { vision: { contains: kw } },
          { definition: { contains: kw } },
        ],
        achieved: false,
      },
      select: { id: true, title: true, vision: true, layer: true },
      take: 4,
      orderBy: { layer: "asc" },
    }),
  ])

  return { tasks, diary, library, cases, dreams }
}
