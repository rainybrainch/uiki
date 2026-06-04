import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { runGeneration } from "@/lib/persona-generate"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const sources = await prisma.personaYoutubeSource.findMany({
    where: { genStatus: { in: ["failed", "pending"] } },
    orderBy: { createdAt: "asc" },
  })

  if (sources.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "未処理ソースなし" })
  }

  const results: { id: string; url: string; result: string }[] = []

  for (const source of sources) {
    await prisma.personaYoutubeSource.update({
      where: { id: source.id },
      data: { genStatus: "pending", genError: null },
    })

    const res = await runGeneration(source)

    if (res.error) {
      await prisma.personaYoutubeSource.update({
        where: { id: source.id },
        data: { genStatus: "failed", genError: res.error },
      })
      results.push({ id: source.id, url: source.url, result: `failed: ${res.error}` })
    } else {
      await prisma.personaYoutubeSource.update({
        where: { id: source.id },
        data: {
          genStatus: "done",
          genError: null,
          lastGenerated: new Date(),
          personaCount: { increment: res.created ?? 0 },
        },
      })
      results.push({ id: source.id, url: source.url, result: `ok: ${res.created}人生成` })
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ ok: true, processed: sources.length, results })
}
