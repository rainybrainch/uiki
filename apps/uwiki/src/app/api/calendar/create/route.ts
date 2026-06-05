import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  // GoogleAccount テーブルのトークンを優先（再ログイン不要）
  const calAccount = await prisma.googleAccount.findFirst({ where: { useCalendar: true } }).catch(() => null)
  const session = calAccount ? null : await getServerSession(authOptions)
  const accessToken = calAccount?.accessToken ?? (session as { accessToken?: string } | null)?.accessToken
  if (!accessToken) {
    return NextResponse.json({ error: "Googleカレンダー未連携" }, { status: 401 })
  }

  const body = await req.json() as {
    title?: string; date?: string; endDate?: string; allDay?: boolean; description?: string
  }
  const { title, date, endDate, allDay, description } = body
  if (!title || !date) {
    return NextResponse.json({ error: "タイトルと日付は必須" }, { status: 400 })
  }

  const event: {
    summary: string; description: string
    start: { date?: string; dateTime?: string; timeZone?: string }
    end:   { date?: string; dateTime?: string; timeZone?: string }
  } = {
    summary: title,
    description: description ?? "",
    start: {},
    end: {},
  }

  if (allDay) {
    event.start = { date }
    event.end   = { date: endDate ?? date }
  } else {
    event.start = { dateTime: `${date}T09:00:00`, timeZone: "Asia/Tokyo" }
    event.end   = { dateTime: `${date}T10:00:00`, timeZone: "Asia/Tokyo" }
  }


  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } }
    console.error("[calendar/create] Google API error:", err)
    return NextResponse.json({ error: err?.error?.message ?? "作成失敗" }, { status: 500 })
  }

  const created = await res.json() as { id: string; htmlLink: string }
  return NextResponse.json({ ok: true, id: created.id, htmlLink: created.htmlLink })
}
