/**
 * Gemini AI マネージャー
 * - 5キーをラウンドロビンで使用
 * - 429（レート制限）時は次のキーに自動フォールバック
 * - 1分後に同キーは自動回復扱い（RPMベース）
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// GEMINI_API_KEY_* または GEMINI_KEY_* の両方に対応
const KEY_ENV_NAMES = [
  ["GEMINI_API_KEY",   "GEMINI_KEY_1"],
  ["GEMINI_API_KEY_2", "GEMINI_KEY_2"],
  ["GEMINI_API_KEY_3", "GEMINI_KEY_3"],
  ["GEMINI_API_KEY_4", "GEMINI_KEY_4"],
  ["GEMINI_API_KEY_5", "GEMINI_KEY_5"],
].map(([a, b]) => process.env[a] || process.env[b] || "").filter(Boolean)

// サーバーサイドのみ: キーごとの冷却タイムスタンプ
const cooldownUntil: Record<number, number> = {}
let lastKeyIndex = 0

/** 設定済みキー数を返す（設定ページ用） */
export function getGeminiKeyCount(): number {
  return KEY_ENV_NAMES.length
}

function getAvailableKey(): { key: string; index: number } | null {
  const keys = KEY_ENV_NAMES
  if (keys.length === 0) return null

  const now = Date.now()
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
        // 一時エラー → 即リトライ（serverless環境で長いsleepはタイムアウトになるため）
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
