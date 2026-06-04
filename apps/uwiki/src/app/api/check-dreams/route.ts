import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const dreams = await prisma.dream.findMany({
    orderBy: { layer: "asc" },
    select: { layer: true, title: true, definition: true }
  })
  return NextResponse.json({ count: dreams.length, dreams: dreams.map(d => ({ layer: d.layer, title: d.title, hasDefinition: !!d.definition })) })
}
