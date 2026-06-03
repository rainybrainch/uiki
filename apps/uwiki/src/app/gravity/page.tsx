import { prisma } from "@/lib/db"
import { GravitySection } from "@/components/gravity/GravitySection"
import { AttractionSection } from "@/components/gravity/AttractionSection"
import { GrowthGraph } from "@/components/gravity/GrowthGraph"
import { format, subDays } from "date-fns"

export const dynamic = "force-dynamic"

export default async function GravityPage() {
  let gravityLogs: any[] = []
  let metrics: any[] = []

  try {
    const last14 = format(subDays(new Date(), 13), "yyyy-MM-dd")
    ;[gravityLogs, metrics] = await Promise.all([
      prisma.gravityLog.findMany({
        orderBy: { date: "desc" },
        take: 30,
      }),
      prisma.attractionMetric.findMany({
        include: {
          logs: {
            where: { date: { gte: last14 } },
            orderBy: { date: "asc" },
          },
        },
        orderBy: { order: "asc" },
      }),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }

  // 成長グラフ用: 14日分の重力ログ数 + 引力平均
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i)
    return format(d, "yyyy-MM-dd")
  })

  const graphData = last14Days.map((date) => {
    const gLogs = gravityLogs.filter((l) => l.date === date)
    const gravityScore = gLogs.reduce((sum, l) => sum + l.intensity, 0)

    const aValues = metrics.flatMap((m) => m.logs.filter((l: any) => l.date === date).map((l: any) => {
      if (!m.target || m.target === 0) return 0
      return Math.min(1, l.value / m.target)
    }))
    const attractionScore = aValues.length > 0
      ? aValues.reduce((a: number, b: number) => a + b, 0) / aValues.length
      : 0

    return { date, gravityScore, attractionScore }
  })

  return (
    <div className="page-container max-w-2xl">
      <div className="animate-fade-in mb-10">
        <h1 className="text-2xl font-serif font-light tracking-wide">雨域</h1>
        <p className="text-sm text-dim mt-1">重力と引力が交わる場所</p>
      </div>

      <div className="space-y-10">
        <GrowthGraph data={graphData} />
        <GravitySection logs={gravityLogs} />
        <AttractionSection metrics={metrics} />
      </div>
    </div>
  )
}
