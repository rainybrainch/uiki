import { getAllMail } from "@/actions/gmail"
import { prisma } from "@/lib/db"
import { Mail, RefreshCw } from "lucide-react"

export const dynamic = "force-dynamic"

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
  return { name: match?.[1]?.trim() || from, email: match?.[2]?.trim() || "" }
}

function relativeTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}分前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}時間前`
    return `${Math.floor(h / 24)}日前`
  } catch { return "" }
}

const ACCOUNT_COLORS: Record<string, string> = {
  "fukuisho0603@gmail.com": "#3a6fc9",
  "fukufukui0205@gmail.com": "#8b5cf6",
  "rainybrain.ch@gmail.com": "#14b8a6",
}

export default async function MailPage() {
  const [messages, accounts] = await Promise.all([
    getAllMail(),
    prisma.googleAccount.findMany({ orderBy: { createdAt: "asc" } }),
  ])

  const unreadCount = messages.filter((m) => m.unread).length

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">メール</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(201,168,76,0.15)", color: "var(--amber)" }}>
              {unreadCount} 未読
            </span>
          )}
        </div>

        {/* アカウントバッジ */}
        <div className="flex flex-wrap gap-2 mb-4">
          {accounts.map((a) => (
            <span key={a.email} className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full"
              style={{
                background: `${ACCOUNT_COLORS[a.email] ?? "#888"}18`,
                border: `1px solid ${ACCOUNT_COLORS[a.email] ?? "#888"}44`,
                color: ACCOUNT_COLORS[a.email] ?? "#888",
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCOUNT_COLORS[a.email] ?? "#888" }} />
              {a.email}
            </span>
          ))}
          {accounts.length === 0 && (
            <p className="text-xs text-dim">設定からGoogleアカウントを追加してください</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-dim text-sm">メールを取得できませんでした</div>
        ) : (
          <div className="space-y-1">
            {messages.map((m) => {
              const { name, email } = parseFrom(m.from)
              const color = ACCOUNT_COLORS[m.account] ?? "#888"
              return (
                <div key={`${m.account}-${m.id}`}
                  className="rounded-xl p-3 transition-colors"
                  style={{
                    background: m.unread ? `${color}0a` : "transparent",
                    border: `1px solid ${m.unread ? `${color}22` : "var(--border)"}`,
                  }}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: color, opacity: m.unread ? 1 : 0.3 }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-xs truncate ${m.unread ? "font-medium" : "text-dim"}`}
                          style={{ color: m.unread ? color : undefined }}>
                          {name}
                          <span className="text-faint ml-1 font-normal">&lt;{email}&gt;</span>
                        </span>
                        <span className="text-[10px] text-faint shrink-0">{relativeTime(m.date)}</span>
                      </div>
                      <p className={`text-sm mb-0.5 truncate ${m.unread ? "font-medium" : ""}`}>
                        {m.subject}
                      </p>
                      <p className="text-[11px] text-faint line-clamp-1">{m.snippet}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
