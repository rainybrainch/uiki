import { prisma } from "@/lib/db"
import { ai } from "@/lib/ai"

export async function syncAllToGist() {
  const gistId = process.env.PERSONA_GIST_ID || ""
  const token  = process.env.GITHUB_TOKEN || ""
  if (!gistId || !token) return

  const personas = await prisma.commentPersona.findMany({
    where: { enabled: true }, orderBy: { createdAt: "desc" }
  })

  const content = JSON.stringify(personas.map(p => ({
    name:        p.name,
    roleType:    p.roleType,
    catchphrase: p.catchphrase,
    color:       p.color,
    words:       p.words ? p.words.split(",").map(s => s.trim()).filter(Boolean) : [],
    genres:      p.genres ? p.genres.split(",").map(s => s.trim()).filter(Boolean) : [],
    tags:        p.tags ? p.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
    tone:        p.tone,
    enabled:     p.enabled,
  })), null, 2)

  try {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { "rainybrain-personas.json": { content } } }),
    })
  } catch (e) {
    console.error("[persona-generate] Gist sync failed:", e)
  }
}

export async function runGeneration(source: {
  id: string; url: string; description: string; streamGenres: string
}): Promise<{ ok?: boolean; created?: number; error?: string }> {
  const streamGenres = source.streamGenres || "配信,エンタメ"
  const prompt = `You create YouTube live chat personas for a Japanese streaming simulator.

YouTube: ${source.url}
${source.description ? `配信の特徴: ${source.description}` : ""}
このストリームのジャンル: ${streamGenres}

6人のペルソナをJSONの配列のみで出力（他テキスト不要）。

形式: {"name":"名前(2-8文字)","roleType":"ロール","catchphrase":"口癖(8-25文字)","color":"#hex","words":"ワード1,ワード2","genres":"ジャンル1,ジャンル2","tags":"タグ1,タグ2","tone":"話し方"}

roleType: 共感勢|知識勢|質問勢|懐疑勢|応援勢|初心者勢|ネタ勢|妄想勢|開発者勢|投資家勢
genresには${streamGenres}を2-3個含めること。日本語で。`

  try {
    const text = await ai.flash(prompt)
    if (!text) return { error: "AI生成に失敗しました" }
    const match = text.match(/\[[\s\S]*?\]/)
    if (!match) throw new Error("JSONが見つかりません")

    const generated = JSON.parse(match[0]).filter((p: any) => p?.name)
    const existing = await prisma.commentPersona.findMany({ select: { name: true } })
    const existingNames = new Set(existing.map((e: any) => e.name))

    let created = 0
    for (const p of generated) {
      if (existingNames.has(p.name)) continue
      await prisma.commentPersona.create({
        data: {
          name:        p.name,
          roleType:    p.roleType || "共感勢",
          catchphrase: p.catchphrase || "",
          color:       p.color || "#a0b4ff",
          words:       typeof p.words === "string" ? p.words : (p.words || []).join(","),
          genres:      typeof p.genres === "string" ? p.genres : (p.genres || []).join(","),
          tags:        typeof p.tags === "string" ? p.tags : (p.tags || []).join(","),
          tone:        p.tone || "",
          sourceUrl:   source.url,
          enabled:     true,
        }
      })
      created++
    }

    await syncAllToGist()
    return { ok: true, created }
  } catch (e: any) {
    return { error: e.message }
  }
}
