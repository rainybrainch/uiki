"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { today } from "@/lib/date"

export async function saveDiaryEntry(data: { date?: string; title: string; content: string }) {
  const date = data.date ?? today()
  await prisma.diaryEntry.upsert({
    where: { date },
    update: { title: data.title, content: data.content },
    create: { date, title: data.title, content: data.content },
  })
  revalidatePath("/diary")
  revalidatePath("/")
}

export async function deleteDiaryEntry(id: string) {
  await prisma.diaryEntry.delete({ where: { id } })
  revalidatePath("/diary")
  revalidatePath("/")
}
