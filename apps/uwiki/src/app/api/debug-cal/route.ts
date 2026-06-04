import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { fetchCalendarEvents, getValidToken } from "@/lib/auth"

export async function GET() {
  try {
    const account = await prisma.googleAccount.findFirst({ where: { useCalendar: true } })
    if (!account) return NextResponse.json({ error: "no account with useCalendar=true" })

    const token = await getValidToken(account.email)
    if (!token) return NextResponse.json({ error: "no valid token" })

    // 直接 API を叩いてレスポンスを確認
    const now = new Date()
    const end = new Date(); end.setDate(end.getDate() + 90)
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events")
    url.searchParams.set("timeMin", now.toISOString())
    url.searchParams.set("timeMax", end.toISOString())
    url.searchParams.set("singleEvents", "true")
    url.searchParams.set("maxResults", "10")

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
    const body = await res.json()

    return NextResponse.json({
      email: account.email,
      expiresAt: account.expiresAt?.toString(),
      httpStatus: res.status,
      error: body.error,
      eventCount: body.items?.length ?? 0,
      events: (body.items ?? []).slice(0, 3).map((e: any) => ({ summary: e.summary, start: e.start })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) })
  }
}
