import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthUrl  = process.env.NEXTAUTH_URL
  if (!clientId || !clientSecret || !nextAuthUrl) {
    console.error("[google-add/callback] Missing env vars")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.redirect(`${nextAuthUrl}/settings?error=no_code`)

  // code → tokens
  let tokens: any
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  `${nextAuthUrl}/api/google-add/callback`,
        grant_type:    "authorization_code",
      }),
    })
    tokens = await tokenRes.json()
  } catch (e) {
    console.error("[google-add/callback] token fetch failed:", e)
    return NextResponse.redirect(`${nextAuthUrl}/settings?error=token_failed`)
  }
  if (!tokens.access_token) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=token_failed`)

  // メールアドレス取得
  let user: any
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    user = await userRes.json()
  } catch (e) {
    console.error("[google-add/callback] userinfo fetch failed:", e)
    return NextResponse.redirect(`${nextAuthUrl}/settings?error=no_email`)
  }
  if (!user.email) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=no_email`)

  await prisma.googleAccount.upsert({
    where: { email: user.email },
    update: {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt:    tokens.expires_in ? BigInt(Date.now() + tokens.expires_in * 1000) : null,
    },
    create: {
      email:        user.email,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt:    tokens.expires_in ? BigInt(Date.now() + tokens.expires_in * 1000) : null,
      useGmail:     true,
      useCalendar:  false,
    },
  })

  return NextResponse.redirect(`${nextAuthUrl}/settings?added=${user.email}`)
}
