"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"

export async function createProject(data: {
  name: string
  description?: string
  color?: string
  icon?: string
}) {
  const count = await prisma.project.count()
  const project = await prisma.project.create({
    data: { ...data, order: count },
  })
  revalidatePath("/tasks")
  revalidatePath("/")
  return project
}

export async function updateProject(id: string, data: {
  name?: string
  description?: string
  color?: string
  archived?: boolean
}) {
  await prisma.project.update({ where: { id }, data })
  revalidatePath("/tasks")
}

export async function deleteProject(id: string) {
  // タスクの projectId を null にしてから削除
  await prisma.task.updateMany({ where: { projectId: id }, data: { projectId: null } })
  await prisma.project.delete({ where: { id } })
  revalidatePath("/tasks")
}

export async function assignTaskToProject(taskId: string, projectId: string | null) {
  await prisma.task.update({ where: { id: taskId }, data: { projectId } })
  revalidatePath("/tasks")
}
