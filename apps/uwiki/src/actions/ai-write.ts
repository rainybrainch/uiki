"use server"

import { ai } from "@/lib/ai"

/** 走り書きを読みやすい文に整形 */
export async function polishText(raw: string, context?: string): Promise<string> {
  if (!raw.trim()) return raw
  const text = await ai.flash(
    `以下のテキストを自然で読みやすい日本語に整形してください。内容・意味は変えず、文体を整えるだけです。マークダウンや箇条書きは使わず、流れるような文章にしてください。整形後のテキストだけを返してください。
${context ? `\nコンテキスト: ${context}` : ""}

テキスト:
${raw}`
  )
  return text.trim()
}

/** 本・映画・コンテンツの感想から読雨投稿データを生成 */
export async function generateYomuPost(params: {
  title: string
  type: string
  rawImpression: string
}): Promise<{ text: string; stars: number; tags: string }> {
  const result = await ai.flash(
    `以下の作品の感想を元に、読雨（個人の読書・鑑賞記録サービス）への投稿データを生成してください。

作品名: ${params.title}
種別: ${params.type}
感想メモ: ${params.rawImpression}

JSON形式で返してください:
{
  "text": "整形された感想文（100〜200文字、自然な日本語）",
  "stars": 星評価の数値(1〜5),
  "tags": "タグ1,タグ2,タグ3"
}`
  )
  try {
    const match = result.match(/\{[\s\S]*\}/)
    if (!match) throw new Error()
    const parsed = JSON.parse(match[0])
    return {
      text:  parsed.text  ?? params.rawImpression,
      stars: Number(parsed.stars) || 3,
      tags:  parsed.tags  ?? "",
    }
  } catch {
    return { text: params.rawImpression, stars: 3, tags: "" }
  }
}

/** ブクログ向けレビュー文を生成 */
export async function generateBooklogReview(params: {
  title: string
  author?: string
  rawImpression: string
}): Promise<string> {
  const text = await ai.flash(
    `以下の本の感想メモを、ブクログへの投稿に適したレビュー文に整形してください。
200〜400文字程度、読んだ人が参考になる内容にしてください。ネタバレは避け、魅力や感想を中心に。
レビュー文だけを返してください。

本のタイトル: ${params.title}
${params.author ? `著者: ${params.author}` : ""}
感想メモ: ${params.rawImpression}`
  )
  return text.trim()
}

/** 日記エントリの整形・補完 */
export async function polishDiary(raw: string, mood?: string): Promise<string> {
  if (!raw.trim()) return raw
  const text = await ai.flash(
    `以下の日記の走り書きを、読みやすい日記文に整形してください。
感情・出来事・気づきを自然な流れで書いてください。過度に美化せず、本人の言葉のニュアンスを残してください。
整形後のテキストだけを返してください。
${mood ? `\n今日の気分: ${mood}` : ""}

日記メモ:
${raw}`
  )
  return text.trim()
}
