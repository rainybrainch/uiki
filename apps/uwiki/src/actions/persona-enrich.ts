"use server"

import { prisma } from "@/lib/db"
import { ai } from "@/lib/ai"
import { revalidatePath } from "next/cache"

type ContentInput = {
  title: string
  type: string        // BOOK / MOVIE / GAME / MUSIC / etc
  creator?: string
  tags?: string
  impression?: string // 感想テキスト
}

/**
 * コンテンツを記録したとき、関連する人格を自動的に豊かにする
 * - 既存人格のwordsを拡張
 * - 必要であれば新人格を提案・生成
 */
export async function enrichPersonasFromContent(content: ContentInput) {
  const personas = await prisma.commentPersona.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  if (personas.length === 0) return { ok: true, updated: 0 }

  const personaList = personas.map((p, i) =>
    `[${i}] ${p.name}（${p.roleType}）口癖:「${p.catchphrase}」 ワード:${p.words || "なし"} ジャンル:${p.genres || "なし"}`
  ).join("\n")

  const prompt = `あなたはAI配信コメント人格管理システムです。

新しいコンテンツが記録されました：
タイトル: ${content.title}
種別: ${content.type}
${content.creator ? `作者/監督: ${content.creator}` : ""}
${content.tags ? `タグ: ${content.tags}` : ""}
${content.impression ? `感想: ${content.impression.slice(0, 200)}` : ""}

既存の人格一覧:
${personaList}

このコンテンツに関連性の高い人格を最大3人選び、その人格の「ワード」を拡張してください。
例: 本なら「著者名、テーマ、登場人物名」、映画なら「監督、ジャンル、テーマ」など。

JSONのみ返してください:
[{"index":0,"addWords":"追加ワード1,追加ワード2","addGenres":"追加ジャンル"}]`

  try {
    const result = await ai.flash(prompt)
    const match = result.match(/\[[\s\S]*?\]/)
    if (!match) return { ok: true, updated: 0 }

    const updates: { index: number; addWords: string; addGenres?: string }[] = JSON.parse(match[0])
    let updated = 0

    for (const u of updates) {
      const persona = personas[u.index]
      if (!persona) continue

      const currentWords = persona.words ? persona.words.split(",").map((w) => w.trim()) : []
      const currentGenres = persona.genres ? persona.genres.split(",").map((g) => g.trim()) : []

      const newWords = u.addWords ? u.addWords.split(",").map((w) => w.trim()) : []
      const newGenres = u.addGenres ? u.addGenres.split(",").map((g) => g.trim()) : []

      const mergedWords = [...new Set([...currentWords, ...newWords])].filter(Boolean).join(",")
      const mergedGenres = [...new Set([...currentGenres, ...newGenres])].filter(Boolean).join(",")

      await prisma.commentPersona.update({
        where: { id: persona.id },
        data: { words: mergedWords, genres: mergedGenres },
      })
      updated++
    }

    // Gist に同期
    await syncPersonasToGist()
    revalidatePath("/personas")
    return { ok: true, updated }
  } catch {
    return { ok: true, updated: 0 }
  }
}

async function syncPersonasToGist() {
  const gistId = process.env.PERSONA_GIST_ID
  const token = process.env.GITHUB_TOKEN
  if (!gistId || !token) return

  const personas = await prisma.commentPersona.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "desc" },
  })

  const content = JSON.stringify(personas.map((p) => ({
    name:        p.name,
    roleType:    p.roleType,
    catchphrase: p.catchphrase,
    color:       p.color,
    words:       p.words ? p.words.split(",").filter(Boolean) : [],
    genres:      p.genres ? p.genres.split(",").filter(Boolean) : [],
    tags:        p.tags ? p.tags.split(",").filter(Boolean) : [],
    tone:        p.tone,
    enabled:     p.enabled,
  })), null, 2)

  try {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { "rainybrain-personas.json": { content } } }),
    })
  } catch (e) { console.error("[persona-enrich] error:", e) }
}
