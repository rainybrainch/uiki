const YOMU_GIST_ID = "cffc5abcf62103b27effe2efba25ca6a"

export type YomuEntry = {
  id: string
  type: "health" | "body_scan" | "quote" | "book" | "memo" | "diary" | "money"
  date: string        // YYYYMMDD
  created_at: string
  // health
  metric?: string
  value?: number
  unit?: string
  memo?: string
  source?: string
  // body_scan
  image_url?: string
  rank?: string
  // book/quote
  title?: string
  text?: string
  author?: string
  tags?: string
  stars?: number | string
}

export type YomuData = {
  version: number
  updatedAt: string
  entries: YomuEntry[]
}

export async function fetchYomuData(): Promise<YomuData | null> {
  try {
    const res = await fetch(
      `https://api.github.com/gists/${YOMU_GIST_ID}`,
      { next: { revalidate: 300 } }   // 5分キャッシュ
    )
    if (!res.ok) return null
    const gist = await res.json()
    const content = gist.files?.["yomu-data.json"]?.content
    if (!content) return null
    return JSON.parse(content) as YomuData
  } catch {
    return null
  }
}

/** YYYYMMDD → yyyy-MM-dd */
export function yomuDateToIso(d: string): string {
  if (d.length !== 8) return d
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
}

/** 直近N日のhealthエントリを metric でグルーピング */
export function groupHealthByMetric(entries: YomuEntry[], days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const health = entries.filter((e) => {
    if (e.type !== "health" || !e.metric || e.value === undefined) return false
    const iso = yomuDateToIso(e.date)
    return new Date(iso) >= cutoff
  })

  const grouped: Record<string, { dates: string[]; values: number[]; unit: string }> = {}
  for (const e of health) {
    const key = e.metric!
    if (!grouped[key]) grouped[key] = { dates: [], values: [], unit: e.unit ?? "" }
    grouped[key].dates.push(yomuDateToIso(e.date))
    grouped[key].values.push(e.value!)
  }
  return grouped
}
