"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createDream(data: {
  title: string
  definition?: string
  vision?: string
  vow?: string
  constraints?: string
  period?: string
  kpi?: string
  connections?: string
  category: string
  layer?: number
  axis?: string
}) {
  const count = await prisma.dream.count()
  await prisma.dream.create({
    data: {
      title: data.title,
      definition:  data.definition  || null,
      vision:      data.vision      || null,
      vow:         data.vow         || null,
      constraints: data.constraints || null,
      period:      data.period      || null,
      kpi:         data.kpi         || null,
      connections: data.connections || null,
      category:    data.category    as any,
      layer:       data.layer       ?? count + 1,
      order:       count,
      axis:        data.axis        || null,
    },
  })
  revalidatePath("/dreams")
}

export async function updateDream(id: string, data: {
  title?: string
  definition?: string
  vision?: string
  vow?: string
  constraints?: string
  period?: string
  kpi?: string
  connections?: string
  category?: string
  layer?: number
  axis?: string
}) {
  await prisma.dream.update({
    where: { id },
    data: {
      ...(data.title       !== undefined ? { title:       data.title }                 : {}),
      ...(data.definition  !== undefined ? { definition:  data.definition  || null }   : {}),
      ...(data.vision      !== undefined ? { vision:      data.vision      || null }   : {}),
      ...(data.vow         !== undefined ? { vow:         data.vow         || null }   : {}),
      ...(data.constraints !== undefined ? { constraints: data.constraints || null }   : {}),
      ...(data.period      !== undefined ? { period:      data.period      || null }   : {}),
      ...(data.kpi         !== undefined ? { kpi:         data.kpi         || null }   : {}),
      ...(data.connections !== undefined ? { connections: data.connections || null }   : {}),
      ...(data.category    !== undefined ? { category:    data.category    as any }    : {}),
      ...(data.layer       !== undefined ? { layer:       data.layer }                 : {}),
      ...(data.axis        !== undefined ? { axis:        data.axis        || null }   : {}),
    },
  })
  revalidatePath("/dreams")
  revalidatePath(`/dreams/${id}`)
}

export async function updateDreamAxis(id: string, axis: string | null) {
  await prisma.dream.update({
    where: { id },
    data: { axis },
  })
  revalidatePath("/dreams")
  revalidatePath(`/dreams/${id}`)
}

export async function updateDreamProgress(id: string, progress: number) {
  await prisma.dream.update({
    where: { id },
    data: { progress: Math.min(100, Math.max(0, progress)) },
  })
  revalidatePath("/dreams")
  revalidatePath(`/dreams/${id}`)
}

export async function achieveDream(id: string) {
  await prisma.dream.update({
    where: { id },
    data: { achieved: true, achievedAt: new Date(), progress: 100 },
  })
  revalidatePath("/dreams")
  revalidatePath(`/dreams/${id}`)
}

export async function deleteDream(id: string) {
  await prisma.dream.delete({ where: { id } })
  revalidatePath("/dreams")
}
