"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { ItemType, ItemStatus } from "@uwiki/database"

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
  await prisma.libraryItem.create({ data })
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
  await prisma.libraryItem.update({ where: { id }, data })
  revalidatePath("/library")
}

export async function deleteLibraryItem(id: string) {
  await prisma.libraryItem.delete({ where: { id } })
  revalidatePath("/library")
  revalidatePath("/")
}
