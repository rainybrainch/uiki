import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient"

export const dynamic = "force-dynamic"

async function fetchAncestors(
  parentId: string | null,
  visited = new Set<string>(),
  depth = 0
): Promise<{ id: string; title: string }[]> {
  if (!parentId || depth > 10 || visited.has(parentId)) return []
  visited.add(parentId)
  const parent = await prisma.task.findUnique({
    where: { id: parentId },
    select: { id: true, title: true, parentTaskId: true },
  })
  if (!parent) return []
  const ancestors = await fetchAncestors(parent.parentTaskId, visited, depth + 1)
  return [...ancestors, { id: parent.id, title: parent.title }]
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [task, projects, dreams] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        project: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.project.findMany({ where: { archived: false }, orderBy: { order: "asc" } }),
    prisma.dream.findMany({
      where: { achieved: false },
      orderBy: { layer: "asc" },
      select: { id: true, title: true, layer: true },
    }),
  ])

  if (!task) notFound()

  const ancestors = await fetchAncestors((task as { parentTaskId?: string | null }).parentTaskId ?? null)

  return <TaskDetailClient task={task} projects={projects} ancestors={ancestors} dreams={dreams} />
}
