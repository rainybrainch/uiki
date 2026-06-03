"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { today } from "@/lib/date"

export async function createHabit(data: { name: string; description?: string; color?: string }) {
  await prisma.habit.create({ data })
  revalidatePath("/habits")
  revalidatePath("/")
}

export async function updateHabit(id: string, data: { name?: string; description?: string; color?: string }) {
  await prisma.habit.update({ where: { id }, data })
  revalidatePath("/habits")
  revalidatePath("/")
}

export async function deleteHabit(id: string) {
  await prisma.habit.delete({ where: { id } })
  revalidatePath("/habits")
  revalidatePath("/")
}

export async function toggleHabitLog(habitId: string, date?: string) {
  const d = date ?? today()
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: d } },
  })
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } })
  } else {
    await prisma.habitLog.create({ data: { habitId, date: d } })
  }
  revalidatePath("/habits")
  revalidatePath("/")
}
