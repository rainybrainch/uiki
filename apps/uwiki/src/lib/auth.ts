import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/gmail.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken  = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt    = account.expires_at
        // メイン Google アカウントを GoogleAccount テーブルにも保存
        const email = (profile as any)?.email
        if (email && account.access_token) {
          try {
            await prisma.googleAccount.upsert({
              where: { email },
              update: {
                accessToken:  account.access_token,
                refreshToken: account.refresh_token ?? null,
                expiresAt:    account.expires_at ? BigInt(account.expires_at * 1000) : null,
                useCalendar:  true,
                useGmail:     true,
              },
              create: {
                email,
                accessToken:  account.access_token,
                refreshToken: account.refresh_token ?? null,
                expiresAt:    account.expires_at ? BigInt(account.expires_at * 1000) : null,
                useCalendar:  true,
                useGmail:     true,
              },
            })
          } catch {}
        }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/settings" },
}

/** GoogleAccount のアクセストークンを必要に応じてリフレッシュして返す */
export async function getValidToken(email: string): Promise<string | null> {
  const { prisma } = await import("@/lib/db")
  const account = await prisma.googleAccount.findUnique({ where: { email } })
  if (!account) return null

  const now = BigInt(Date.now())
  const expired = account.expiresAt ? account.expiresAt < now + BigInt(60_000) : false

  if (!expired) return account.accessToken

  // リフレッシュ
  if (!account.refreshToken) return null
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refreshToken,
        grant_type:    "refresh_token",
      }),
    })
    if (!res.ok) {
      console.error("[getValidToken] refresh failed:", res.status)
      return null
    }
    const data = await res.json()
    const newToken = data.access_token as string
    await prisma.googleAccount.update({
      where: { email },
      data: {
        accessToken: newToken,
        expiresAt: data.expires_in ? BigInt(Date.now() + data.expires_in * 1000) : null,
      },
    })
    return newToken
  } catch (e) {
    console.error("[getValidToken] exception:", e)
    return null
  }
}

// Google Calendar イベント取得
export async function fetchCalendarEvents(accessToken: string, days = 14, pastDays = 0) {
  const now = new Date()
  const start = new Date(now); start.setDate(start.getDate() - pastDays)
  const end = new Date(now); end.setDate(end.getDate() + days)

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events")
  url.searchParams.set("timeMin", start.toISOString())
  url.searchParams.set("timeMax", end.toISOString())
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("maxResults", "50")

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items ?? []) as GoogleCalendarEvent[]
  } catch {
    return []
  }
}

export type GoogleCalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  colorId?: string
  htmlLink: string
}
