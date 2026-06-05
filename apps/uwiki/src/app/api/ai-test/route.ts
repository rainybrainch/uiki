import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/lib/ai"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  try {
    const result = await ai.flash("「雨」を一言で表現してください。日本語で10文字以内。テキストのみ返してください。")
    return NextResponse.json({ ok: true, result: result.trim() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "失敗" })
  }
}
