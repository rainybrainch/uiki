"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { today } from "@/lib/date"

export async function createGravityLog({ text, intensity }: { text: string; intensity: number }) {
  await prisma.gravityLog.create({
    data: { date: today(), text, intensity },
  })
  revalidatePath("/gravity")
}

export async function createAttractionMetric({
  name, target, unit,
}: { name: string; target?: number; unit?: string }) {
  const count = await prisma.attractionMetric.count()
  await prisma.attractionMetric.create({
    data: { name, target, unit, order: count },
  })
  revalidatePath("/gravity")
}

export async function recordAttractionValue({ metricId, value }: { metricId: string; value: number }) {
  const date = today()
  await prisma.attractionLog.upsert({
    where: { metricId_date: { metricId, date } },
    update: { value },
    create: { metricId, date, value },
  })
  await prisma.attractionMetric.update({
    where: { id: metricId },
    data: { value },
  })
  revalidatePath("/gravity")
}
