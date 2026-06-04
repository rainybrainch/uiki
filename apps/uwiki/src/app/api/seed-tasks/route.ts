import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  const tasks = [
    {
      title: "家の掃除（土日）",
      memo: "毎週土日のどちらかで実施",
      priority: "MEDIUM" as const,
      recurrence: "weekly",
      tags: "習慣,生活",
      column: "todo",
    },
    {
      title: "ゴミ袋1袋分を断捨離",
      memo: "毎週1袋分を捨てる・処分する",
      priority: "MEDIUM" as const,
      recurrence: "weekly",
      tags: "習慣,断捨離",
      column: "todo",
    },
  ]

  const created = []
  for (const t of tasks) {
    const task = await prisma.task.create({ data: t })
    created.push(task.id)
  }

  return NextResponse.json({ ok: true, created })
}
