import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getValidToken } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const accounts = await prisma.googleAccount.findMany({ where: { useGmail: true } })

  const results = await Promise.all(accounts.map(async (a) => {
    const now = BigInt(Date.now())
    const tokenExpired = a.expiresAt ? a.expiresAt < now : null
    const hasRefreshToken = !!a.refreshToken

    // 実際にトークンリフレッシュを試みる
    let validToken: string | null = null
    let refreshError: string | null = null
    try {
      validToken = await getValidToken(a.email)
    } catch (e) {
      refreshError = String(e)
    }

    // トークンが取れたら Gmail API を1回叩いて確認
    const testToken = validToken ?? a.accessToken
    let gmailOk = false
    let gmailStatus = 0
    try {
      const r = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/profile",
        { headers: { Authorization: `Bearer ${testToken}` } }
      )
      gmailStatus = r.status
      gmailOk = r.ok
    } catch { /* network error */ }

    return {
      email: a.email,
      useGmail: a.useGmail,
      hasRefreshToken,
      tokenExpired,
      refreshSucceeded: !!validToken,
      refreshError,
      gmailApiStatus: gmailStatus,
      gmailOk,
    }
  }))

  return NextResponse.json({ accounts: results })
}
