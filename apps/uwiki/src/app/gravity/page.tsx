import { prisma } from "@/lib/db"
import { GravityPage } from "@/components/gravity/GravityPage"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function Page() {
  let gravityLogs: any[] = []
  let metrics: any[] = []

  try {
    const last14 = format(subDays(new Date(), 13), "yyyy-MM-dd")
    ;[gravityLogs, metrics] = await Promise.all([
      prisma.gravityLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.attractionMetric.findMany({
        include: { logs: { where: { date: { gte: last14 } }, orderBy: { date: "asc" } } },
        orderBy: { order: "asc" },
      }),
    ])
  } catch {}

  const last14Days = Array.from({ length: 14 }, (_, i) =>
    format(subDays(new Date(), 13 - i), "yyyy-MM-dd")
  )
  const graphData = last14Days.map((date) => {
    const gLogs = gravityLogs.filter((l) => l.date === date)
    const gravityScore = gLogs.reduce((s, l) => s + l.intensity, 0)
    const aVals = metrics.flatMap((m) =>
      m.logs.filter((l: any) => l.date === date).map((l: any) =>
        m.target ? Math.min(1, l.value / m.target) : 0
      )
    )
    const attractionScore = aVals.length > 0
      ? aVals.reduce((a: number, b: number) => a + b, 0) / aVals.length
      : 0
    return { date, gravityScore, attractionScore }
  })

  return <GravityPage gravityLogs={gravityLogs} metrics={metrics} graphData={graphData} />
}
