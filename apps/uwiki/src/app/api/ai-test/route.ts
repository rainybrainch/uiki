import { NextResponse } from "next/server"
import { ai } from "@/lib/ai"

export async function GET() {
  try {
    const result = await ai.flash("「雨」を一言で表現してください。日本語で10文字以内。テキストのみ返してください。")
    return NextResponse.json({ ok: true, result: result.trim() })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "失敗" })
  }
}
