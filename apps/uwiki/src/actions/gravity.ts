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

export async function deleteGravityLog(id: string) {
  await prisma.gravityLog.delete({ where: { id } })
  revalidatePath("/gravity")
}

export async function deleteAttractionMetric(id: string) {
  await prisma.attractionMetric.delete({ where: { id } })
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

export async function recordSelfReport({ label, value }: { label: string; value: number }) {
  const date = today()
  // 同名の指標を探す、なければ自動作成
  let metric = await prisma.attractionMetric.findFirst({ where: { name: label } })
  if (!metric) {
    const count = await prisma.attractionMetric.count()
    metric = await prisma.attractionMetric.create({
      data: { name: label, target: 5, unit: "/ 5", order: count },
    })
  }
  await prisma.attractionLog.upsert({
    where: { metricId_date: { metricId: metric.id, date } },
    update: { value },
    create: { metricId: metric.id, date, value },
  })
  await prisma.attractionMetric.update({ where: { id: metric.id }, data: { value } })
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
