import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { format } from "date-fns"

function today8() {
  return format(new Date(), "yyyy-MM-dd")
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const results: Record<string, number> = {}

    // ─── 砂のログ → GravityLog ─────────────────────────
    const sandLog: any[] = body.uiki_sand_log ?? []
    if (sandLog.length > 0) {
      const rows = sandLog.map((s: any) => ({
        date: (s.created_at || s.createdAt || today8()).slice(0, 10),
        text: s.text ?? s.content ?? "",
        intensity: s.weight === 5 ? 3 : s.weight === 3 ? 2 : 1,
      })).filter((r: any) => r.text.trim())

      await prisma.gravityLog.createMany({ data: rows, skipDuplicates: false })
      results.gravityLogs = rows.length
    }

    // ─── 引力雨域 → AttractionMetric + AttractionLog ───
    const attraction: any = body.shared_rb_attraction ?? {}
    const attrItems: Record<string, any[]> = attraction.items ?? {}
    const attrConfig: Record<string, any> = attraction.config ?? {}

    let attrCount = 0
    let attrLogCount = 0
    for (const [key, logs] of Object.entries(attrItems)) {
      const cfg = attrConfig[key] ?? {}
      const existing = await prisma.attractionMetric.findFirst({ where: { name: key } })
      const metricId = existing?.id ?? (await prisma.attractionMetric.create({
        data: {
          name: key,
          target: cfg.goal ? Number(cfg.goal) : null,
          unit: cfg.unit ?? null,
          color: cfg.color ?? "#3a6fc9",
          order: attrCount,
          value: 0,
        },
      })).id
      attrCount++

      const logRows = (Array.isArray(logs) ? logs : [])
        .filter((l: any) => l?.date && l?.value !== undefined)
        .map((l: any) => ({
          metricId,
          date: String(l.date).slice(0, 10),
          value: Number(l.value),
        }))

      if (logRows.length > 0) {
        await prisma.attractionLog.createMany({ data: logRows, skipDuplicates: true })
        // 最新値をキャッシュ
        const latest = logRows[logRows.length - 1]
        await prisma.attractionMetric.update({ where: { id: metricId }, data: { value: latest.value } })
        attrLogCount += logRows.length
      }
    }
    results.attractionMetrics = attrCount
    results.attractionLogs = attrLogCount

    // ─── 設定（都市）─────────────────────────────────
    const gravity: any = body.shared_rb_gravity ?? {}
    const config: any = body.uiki_config ?? {}
    const city = config.city ?? gravity.city ?? null
    if (city) {
      await prisma.settings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", city },
        update: { city },
      })
      results.settings = 1
    }

    return NextResponse.json({ ok: true, imported: results })
  } catch (e: any) {
    console.error("[migrate]", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
