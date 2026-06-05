"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"

export async function createAdjustment(data: {
  type: "WEEKLY" | "MONTHLY"
  what: string
  why?: string
  result?: string
  vowCheck?: boolean
  constCheck?: boolean
  visionCheck?: boolean
  relatedDream?: string
}) {
  const month = format(new Date(), "yyyy-MM")
  await prisma.adjustmentLog.create({
    data: { ...data, month },
  })
  revalidatePath("/report")
  revalidatePath("/")
}

export async function updateAdjustmentResult(id: string, result: string) {
  await prisma.adjustmentLog.update({
    where: { id },
    data: { result },
  })
  revalidatePath("/report")
  revalidatePath("/")
}

export async function deleteAdjustment(id: string) {
  await prisma.adjustmentLog.delete({ where: { id } })
  revalidatePath("/report")
  revalidatePath("/")
}
