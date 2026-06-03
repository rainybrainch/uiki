"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { today } from "@/lib/date"

export async function createDream(data: {
  title: string
  description?: string
  category: string
  layer?: number
}) {
  const count = await prisma.dream.count()
  await prisma.dream.create({
    data: {
      title: data.title,
      description: data.description || null,
      category: data.category as any,
      layer: data.layer ?? count + 1,
      order: count,
    },
  })
  revalidatePath("/dreams")
}

export async function updateDreamProgress(id: string, progress: number) {
  await prisma.dream.update({
    where: { id },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  })
  revalidatePath("/dreams")
}

export async function achieveDream(id: string) {
  await prisma.dream.update({
    where: { id },
    data: { achieved: true, achievedAt: new Date(), progress: 100 },
  })
  revalidatePath("/dreams")
}

export async function deleteDream(id: string) {
  await prisma.dream.delete({ where: { id } })
  revalidatePath("/dreams")
}
