import { getAllMail } from "@/actions/gmail"
import { prisma } from "@/lib/db"
import { classifyMails, CATEGORY_COLORS } from "@/lib/mail-classify"
import type { MailCategory } from "@/lib/mail-classify"
import { Mail, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

const ACCOUNT_COLORS: Record<string, string> = {
  "fukuisho0603@gmail.com":  "#3a6fc9",
  "fukufukui0205@gmail.com": "#8b5cf6",
  "rainybrain.ch@gmail.com": "#14b8a6",
}

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<?([^>]*)>?$/)
  return { name: (match?.[1]?.trim() || from).slice(0, 24), email: match?.[2]?.trim() || "" }
}

function relativeTime(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}分前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}時間前`
    return `${Math.floor(h / 24)}日前`
  } catch { return "" }
}

const PRIORITY_LABEL: Record<number, string> = { 1: "!!!", 2: "!", 3: "" }

export default async function MailPage() {
  const [messages, accounts] = await Promise.all([
    getAllMail(),
    prisma.googleAccount.findMany({ orderBy: { createdAt: "asc" } }),
  ])

  // Claude で分類
  const classified = await classifyMails(
    messages.slice(0, 30).map((m) => ({
      id: m.id, account: m.account,
      subject: m.subject, from: m.from, snippet: m.snippet,
    }))
  )
  const classMap = Object.fromEntries(classified.map((c) => [`${c.account}:${c.id}`, c]))

  // 重要度順に並べ替え
  const sorted = [...messages].sort((a, b) => {
    const ca = classMap[`${a.account}:${a.id}`]
    const cb = classMap[`${b.account}:${b.id}`]
    const pa = ca?.priority ?? 3
    const pb = cb?.priority ?? 3
    if (pa !== pb) return pa - pb
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const unreadCount = messages.filter((m) => m.unread).length
  const importantCount = classified.filter((c) => c.priority === 1).length

  // カテゴリ別カウント
  const catCount: Record<string, number> = {}
  for (const c of classified) {
    catCount[c.category] = (catCount[c.category] ?? 0) + 1
  }

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-4">
          <Mail size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">メール</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(201,168,76,0.15)", color: "var(--amber)" }}>
              {unreadCount} 未読
            </span>
          )}
          {importantCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
              <AlertCircle size={10} /> {importantCount} 要対応
            </span>
          )}
        </div>

        {/* アカウント＋カテゴリバッジ */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {accounts.map((a) => (
            <span key={a.email} className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${ACCOUNT_COLORS[a.email] ?? "#888"}18`, border: `1px solid ${ACCOUNT_COLORS[a.email] ?? "#888"}33`, color: ACCOUNT_COLORS[a.email] ?? "#888" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ACCOUNT_COLORS[a.email] ?? "#888" }} />
              {a.email.split("@")[0]}
            </span>
          ))}
        </div>

        {/* カテゴリ別サマリー */}
        {Object.keys(catCount).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([cat, cnt]) => (
              <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `${CATEGORY_COLORS[cat as MailCategory] ?? "#888"}15`, color: CATEGORY_COLORS[cat as MailCategory] ?? "#888", border: `1px solid ${CATEGORY_COLORS[cat as MailCategory] ?? "#888"}30` }}>
                {cat} {cnt}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-dim text-sm">
            {accounts.length === 0
              ? "設定からGoogleアカウントを追加してください"
              : "メールを取得できませんでした"}
          </div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((m) => {
              const info = classMap[`${m.account}:${m.id}`]
              const { name } = parseFrom(m.from)
              const acColor = ACCOUNT_COLORS[m.account] ?? "#888"
              const catColor = info ? (CATEGORY_COLORS[info.category] ?? "#888") : "#888"
              const isHigh = info?.priority === 1

              return (
                <div key={`${m.account}:${m.id}`}
                  className="rounded-xl p-3 transition-colors"
                  style={{
                    background: isHigh ? "rgba(248,113,113,0.06)" : m.unread ? `${acColor}08` : "transparent",
                    border: `1px solid ${isHigh ? "rgba(248,113,113,0.25)" : m.unread ? `${acColor}20` : "var(--border)"}`,
                  }}>
                  <div className="flex items-start gap-2.5">
                    {/* アカウントカラードット */}
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: acColor, opacity: m.unread ? 1 : 0.35 }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isHigh && <span className="text-[9px] font-bold shrink-0" style={{ color: "#f87171" }}>!!!</span>}
                          <span className={`text-xs truncate ${m.unread ? "font-medium" : "text-dim"}`}>{name}</span>
                          {info && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: `${catColor}18`, color: catColor }}>
                              {info.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-faint shrink-0">{relativeTime(m.date)}</span>
                      </div>

                      <p className={`text-sm mb-0.5 truncate ${m.unread ? "font-medium" : "text-dim"}`}>
                        {m.subject}
                      </p>

                      {/* AI要約（ある場合） */}
                      {info?.summary ? (
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {info.summary}
                        </p>
                      ) : (
                        <p className="text-[11px] text-faint line-clamp-1">{m.snippet}</p>
                      )}
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
