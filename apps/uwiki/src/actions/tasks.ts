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
      projectId: task.projectId,  // プロジェクトを引き継ぐ
      completed: false,
    },
  })

  revalidatePath("/tasks")
  revalidatePath("/")
}

export async function moveTask(id: string, column: KanbanColumn) {
  try {
    await prisma.task.update({
      where: { id },
      data: { column, completed: column === "done" },
    })
  } catch (e) {
    console.error("[moveTask]", e)
    return
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
      take: 4,
      orderBy: { layer: "asc" },
    }),
  ])

  return { tasks, diary, library, cases, dreams }
}
