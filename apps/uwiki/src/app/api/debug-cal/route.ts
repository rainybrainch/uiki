import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchCalendarEvents, getValidToken } from "@/lib/auth"

export async function GET() {
  try {
    const account = await prisma.googleAccount.findFirst({ where: { useCalendar: true } })
    if (!account) return NextResponse.json({ error: "no account with useCalendar=true" })

    const token = await getValidToken(account.email)
    if (!token) return NextResponse.json({ error: "no valid token" })

    const events = await fetchCalendarEvents(token, 90)
    return NextResponse.json({
      email: account.email,
      tokenRefreshed: token !== account.accessToken,
      eventCount: events.length,
      events: events.slice(0, 5).map((e) => ({ summary: e.summary, start: e.start })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) })
  }
}
