"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { ItemType, ItemStatus } from "@uwiki/database"
import { enrichPersonasFromContent } from "@/actions/persona-enrich"

export async function createLibraryItem(data: {
  type: ItemType
  title: string
  creator?: string
  url?: string
  coverUrl?: string
  status?: ItemStatus
  note?: string
  tags?: string
  finishedAt?: string
}) {
  const item = await prisma.libraryItem.create({ data })
  // 最初からDONEで追加した場合も反映
  if (data.status === "DONE") {
    enrichPersonasFromContent({
      title: item.title, type: item.type,
      creator: item.creator ?? undefined,
      tags: item.tags ?? undefined,
      impression: item.note ?? undefined,
    }).catch(() => {})
  }
  revalidatePath("/library")
  revalidatePath("/")
}

export async function updateLibraryItem(
  id: string,
  data: {
    status?: ItemStatus
    rating?: number | null
    note?: string
    finishedAt?: string | null
    coverUrl?: string
    tags?: string
  }
) {
  const item = await prisma.libraryItem.update({ where: { id }, data })
  // 完了にしたとき → 人格に自動反映（バックグラウンド）
  if (data.status === "DONE") {
    enrichPersonasFromContent({
      title: item.title, type: item.type,
      creator: item.creator ?? undefined,
      tags: item.tags ?? undefined,
      impression: item.note ?? undefined,
    }).catch(() => {})
  }
  revalidatePath("/library")
}

export async function deleteLibraryItem(id: string) {
  await prisma.libraryItem.delete({ where: { id } })
  revalidatePath("/library")
  revalidatePath("/")
}
