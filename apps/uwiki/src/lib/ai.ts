/**
 * Gemini AI マネージャー
 * - 5キーをラウンドロビンで使用
 * - 429（レート制限）時は次のキーに自動フォールバック
 * - 1分後に同キーは自動回復扱い（RPMベース）
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const KEY_ENV_NAMES = [
  "GEMINI_API_KEY",
  "GEMINI_API_KEY_2",
  "GEMINI_API_KEY_3",
  "GEMINI_API_KEY_4",
  "GEMINI_API_KEY_5",
]

// サーバーサイドのみ: キーごとの冷却タイムスタンプ
const cooldownUntil: Record<number, number> = {}
let lastKeyIndex = 0

function getAvailableKey(): { key: string; index: number } | null {
  const now = Date.now()
  const keys = KEY_ENV_NAMES.map((name) => process.env[name]).filter(Boolean) as string[]
  if (keys.length === 0) return null

  // ラウンドロビン + 冷却スキップ
  for (let i = 0; i < keys.length; i++) {
    const idx = (lastKeyIndex + i) % keys.length
    if (!cooldownUntil[idx] || cooldownUntil[idx] < now) {
      lastKeyIndex = (idx + 1) % keys.length
      return { key: keys[idx], index: idx }
    }
  }

  // 全キーが冷却中 → 冷却が最も早く終わるキーを使う
  const earliest = Object.entries(cooldownUntil)
    .sort(([, a], [, b]) => a - b)[0]
  const idx = Number(earliest[0])
  lastKeyIndex = (idx + 1) % keys.length
  return { key: keys[idx], index: idx }
}

export type GeminiModel = "gemini-2.0-flash" | "gemini-1.5-flash" | "gemini-1.5-pro"

export async function geminiGenerate(
  prompt: string,
  options: {
    model?: GeminiModel
    maxRetries?: number
  } = {}
): Promise<string> {
  const { model = "gemini-2.0-flash", maxRetries = 5 } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyInfo = getAvailableKey()
    if (!keyInfo) return ""

    try {
      const genAI = new GoogleGenerativeAI(keyInfo.key)
      const m = genAI.getGenerativeModel({ model })
      const result = await m.generateContent(prompt)
      return result.response.text()
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
        // 60秒冷却
        cooldownUntil[keyInfo.index] = Date.now() + 60_000
        continue
      }
      if (status === 503 || status === 500) {
        // 一時エラー → 10秒後に同キーで再試行
        await new Promise((r) => setTimeout(r, 10_000))
        continue
      }
      throw err
    }
  }
  return ""
}

/**
 * 軽量タスク用（分類・要約）→ Flash
 * 重いタスク用（長文生成・分析）→ Pro
 */
export const ai = {
  flash: (prompt: string) => geminiGenerate(prompt, { model: "gemini-2.0-flash" }),
  pro:   (prompt: string) => geminiGenerate(prompt, { model: "gemini-1.5-pro" }),
}
