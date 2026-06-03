"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createCase(data: {
  name: string
  client?: string
  reward: number
  category?: string
  dueDate?: string
  memo?: string
}) {
  await prisma.case.create({
    data: {
      name: data.name,
      client: data.client || null,
      reward: data.reward,
      category: data.category || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      memo: data.memo || null,
    },
  })
  revalidatePath("/cases")
  revalidatePath("/")
}

export async function updateCaseStatus(id: string, status: string) {
  await prisma.case.update({
    where: { id },
    data: { status: status as any },
  })
  revalidatePath("/cases")
  revalidatePath("/")
}

export async function updateCasePaid(id: string, paidAmount: number) {
  await prisma.case.update({
    where: { id },
    data: { paidAmount, status: "DONE" as any },
  })
  revalidatePath("/cases")
  revalidatePath("/")
}

export async function deleteCase(id: string) {
  await prisma.case.delete({ where: { id } })
  revalidatePath("/cases")
  revalidatePath("/")
}
