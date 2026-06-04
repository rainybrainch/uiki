import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchCalendarEvents } from "@/lib/auth"

export async function GET() {
  try {
    const account = await prisma.googleAccount.findFirst({ where: { useCalendar: true } })
    if (!account) return NextResponse.json({ error: "no account with useCalendar=true" })

    const tokenPreview = account.accessToken.slice(0, 20) + "..."
    const events = await fetchCalendarEvents(account.accessToken, 30)

    return NextResponse.json({
      email: account.email,
      tokenPreview,
      eventCount: events.length,
      events: events.slice(0, 3).map((e) => ({ summary: e.summary, start: e.start })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) })
  }
}
