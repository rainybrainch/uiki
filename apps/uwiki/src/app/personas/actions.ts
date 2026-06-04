"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const ROLE_TYPES = ["共感勢","知識勢","質問勢","懐疑勢","応援勢","初心者勢","ネタ勢","妄想勢","開発者勢","投資家勢"]
const PERSONA_GIST_ID = process.env.PERSONA_GIST_ID || ""
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""

// ── Gist同期 ──────────────────────────────────────────
async function syncToGist(personas: any[]) {
  if (!PERSONA_GIST_ID || !GITHUB_TOKEN) return
  const content = JSON.stringify(personas.map(p => ({
    name:       p.name,
    roleType:   p.roleType,
    catchphrase:p.catchphrase,
    color:      p.color,
    words:      p.words ? p.words.split(",").map((s:string) => s.trim()).filter(Boolean) : [],
    genres:     p.genres ? p.genres.split(",").map((s:string) => s.trim()).filter(Boolean) : [],
    tags:       p.tags ? p.tags.split(",").map((s:string) => s.trim()).filter(Boolean) : [],
    tone:       p.tone,
    enabled:    p.enabled,
  })), null, 2)

  try {
    await fetch(`https://api.github.com/gists/${PERSONA_GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: { "rainybrain-personas.json": { content } }
      }),
    })
  } catch {}
}

// ── 人格 CRUD ─────────────────────────────────────────
export async function createPersona(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "名前は必須です" }

  await prisma.commentPersona.create({
    data: {
      name,
      roleType:    (formData.get("roleType") as string) || "共感勢",
      catchphrase: (formData.get("catchphrase") as string)?.trim() || "",
      color:       (formData.get("color") as string) || "#a0b4ff",
      words:       (formData.get("words") as string)?.trim() || "",
      genres:      (formData.get("genres") as string)?.trim() || "",
      tags:        (formData.get("tags") as string)?.trim() || "",
      tone:        (formData.get("tone") as string)?.trim() || "",
      enabled:     true,
    }
  })

  await syncAllToGist()
  revalidatePath("/personas")
  return { ok: true }
}

export async function togglePersona(id: string, enabled: boolean) {
  await prisma.commentPersona.update({ where: { id }, data: { enabled } })
  await syncAllToGist()
  revalidatePath("/personas")
}

export async function deletePersona(id: string) {
  await prisma.commentPersona.delete({ where: { id } })
  await syncAllToGist()
  revalidatePath("/personas")
}

async function syncAllToGist() {
  const personas = await prisma.commentPersona.findMany({
    where: { enabled: true }, orderBy: { createdAt: "desc" }
  })
  await syncToGist(personas)
}

// ── YouTube ソース管理 ──────────────────────────────────
export async function addYoutubeSource(formData: FormData) {
  const url = (formData.get("url") as string)?.trim()
  if (!url) return { error: "URLは必須です" }

  await prisma.personaYoutubeSource.create({
    data: {
      url,
      description:  (formData.get("description") as string)?.trim() || "",
      streamGenres: (formData.get("streamGenres") as string)?.trim() || "",
    }
  })
  revalidatePath("/personas")
  return { ok: true }
}

export async function deleteYoutubeSource(id: string) {
  await prisma.personaYoutubeSource.delete({ where: { id } })
  revalidatePath("/personas")
}

// ── YouTube → Gemini AI 人格生成 ─────────────────────────
// Gemini キー（GEMINI_KEY_1〜5 または GEMINI_API_KEY〜5 の両方に対応）
const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1 || process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2 || process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_KEY_3 || process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_KEY_4 || process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_KEY_5 || process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[]

let geminiKeyIndex = 0
function nextGeminiKey() {
  const key = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length]
  geminiKeyIndex++
  return key
}

export async function generatePersonasFromSource(sourceId: string) {
  const source = await prisma.personaYoutubeSource.findUnique({ where: { id: sourceId } })
  if (!source) return { error: "ソースが見つかりません" }

  const key = nextGeminiKey()
  if (!key) return { error: "Gemini APIキーが設定されていません" }

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
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.92, maxOutputTokens: 2000 }
        })
      }
    )
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
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
          name:       p.name,
          roleType:   p.roleType || "共感勢",
          catchphrase:p.catchphrase || "",
          color:      p.color || "#a0b4ff",
          words:      typeof p.words === "string" ? p.words : (p.words || []).join(","),
          genres:     typeof p.genres === "string" ? p.genres : (p.genres || []).join(","),
          tags:       typeof p.tags === "string" ? p.tags : (p.tags || []).join(","),
          tone:       p.tone || "",
          sourceUrl:  source.url,
          enabled:    true,
        }
      })
      created++
    }

    await prisma.personaYoutubeSource.update({
      where: { id: sourceId },
      data: {
        lastGenerated: new Date(),
        personaCount: { increment: created },
      }
    })

    await syncAllToGist()
    revalidatePath("/personas")
    return { ok: true, created }
  } catch (e: any) {
    return { error: e.message }
  }
}
