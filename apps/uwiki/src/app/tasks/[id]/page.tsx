import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient"

export const dynamic = "force-dynamic"

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [task, projects] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        project: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.project.findMany({ where: { archived: false }, orderBy: { order: "asc" } }),
  ])

  if (!task) notFound()

  return <TaskDetailClient task={task} projects={projects} />
}
