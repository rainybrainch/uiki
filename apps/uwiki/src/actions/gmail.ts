"use server"

import { prisma } from "@/lib/db"

export type GmailMessage = {
  id: string
  account: string
  subject: string
  from: string
  date: string
  snippet: string
  unread: boolean
}

async function fetchMessages(accessToken: string, email: string, maxResults = 20): Promise<GmailMessage[]> {
  try {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
      { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } }
    )
    if (!listRes.ok) return []
    const list = await listRes.json()
    if (!list.messages) return []

    const messages = await Promise.all(
      list.messages.slice(0, 15).map(async (m: { id: string }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } }
        )
        if (!msgRes.ok) return null
        const msg = await msgRes.json()
        const headers = msg.payload?.headers ?? []
        const get = (name: string) => headers.find((h: any) => h.name === name)?.value ?? ""
        return {
          id:      msg.id,
          account: email,
          subject: get("Subject") || "（件名なし）",
          from:    get("From"),
          date:    get("Date"),
          snippet: msg.snippet ?? "",
          unread:  (msg.labelIds ?? []).includes("UNREAD"),
        } satisfies GmailMessage
      })
    )
    return messages.filter(Boolean) as GmailMessage[]
  } catch {
    return []
  }
}

export async function getAllMail(): Promise<GmailMessage[]> {
  const accounts = await prisma.googleAccount.findMany({ where: { useGmail: true } })
  const results = await Promise.all(
    accounts.map((a) => fetchMessages(a.accessToken, a.email))
  )
  return results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function removeGoogleAccount(email: string) {
  await prisma.googleAccount.delete({ where: { email } })
}
