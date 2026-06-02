"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { today } from "@/lib/date"

export async function saveDiaryEntry(data: {
  date?: string
  title: string
  content: string
}): Promise<{ ok: boolean; error?: string }> {
  const title = data.title?.trim() || "無題"
  const date = data.date ?? today()
  try {
    await prisma.diaryEntry.upsert({
      where: { date },
      update: { title, content: data.content },
      create: { date, title, content: data.content },
    })
    revalidatePath("/diary")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    console.error("[saveDiaryEntry]", e)
    return { ok: false, error: "保存に失敗しました" }
  }
}

export async function deleteDiaryEntry(id: string): Promise<{ ok: boolean }> {
  try {
    await prisma.diaryEntry.delete({ where: { id } })
    revalidatePath("/diary")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    console.error("[deleteDiaryEntry]", e)
    return { ok: false }
  }
}
