import Anthropic from "@anthropic-ai/sdk"

export type MailCategory =
  | "案件"
  | "重要"
  | "通知"
  | "SNS"
  | "ニュース"
  | "その他"

export type ClassifiedMail = {
  id: string
  account: string
  category: MailCategory
  priority: 1 | 2 | 3  // 1=高 2=中 3=低
  summary: string       // 1行要約
}

const CATEGORY_COLORS: Record<MailCategory, string> = {
  案件:    "#c9a84c",
  重要:    "#f87171",
  通知:    "#3a6fc9",
  SNS:     "#8b5cf6",
  ニュース: "#14b8a6",
  その他:  "#64748b",
}

export { CATEGORY_COLORS }

export async function classifyMails(
  mails: { id: string; account: string; subject: string; from: string; snippet: string }[]
): Promise<ClassifiedMail[]> {
  if (!process.env.ANTHROPIC_API_KEY || mails.length === 0) {
    return mails.map((m) => ({
      id: m.id, account: m.account,
      category: "その他" as MailCategory,
      priority: 3 as const,
      summary: m.snippet.slice(0, 60),
    }))
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const mailList = mails.map((m, i) =>
    `[${i}] from: ${m.from} | subject: ${m.subject} | snippet: ${m.snippet.slice(0, 120)}`
  ).join("\n")

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `以下のメール一覧を分類してください。各メールについてJSON配列で返してください。

カテゴリ: 案件 / 重要 / 通知 / SNS / ニュース / その他
優先度: 1(高)=即対応が必要 2(中)=確認すべき 3(低)=流し読みでOK
summary: 日本語1行要約（最大30文字）

必ずこの形式のJSONのみ返してください:
[{"index":0,"category":"...","priority":1,"summary":"..."},...]

メール一覧:
${mailList}`,
    }],
  })

  try {
    const text = (message.content[0] as any).text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("no JSON")
    const results: { index: number; category: MailCategory; priority: 1|2|3; summary: string }[] = JSON.parse(jsonMatch[0])

    return results.map((r) => ({
      id:       mails[r.index]?.id ?? "",
      account:  mails[r.index]?.account ?? "",
      category: r.category ?? "その他",
      priority: r.priority ?? 3,
      summary:  r.summary ?? "",
    }))
  } catch {
    return mails.map((m) => ({
      id: m.id, account: m.account,
      category: "その他" as MailCategory,
      priority: 3 as const,
      summary: m.snippet.slice(0, 60),
    }))
  }
}
