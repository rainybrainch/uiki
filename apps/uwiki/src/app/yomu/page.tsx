import { fetchYomuData, groupHealthByMetric, yomuDateToIso } from "@/lib/yomu"
import { YomuHealthChart } from "@/components/yomu/YomuHealthChart"
import { YomuBodyScan } from "@/components/yomu/YomuBodyScan"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Droplets } from "lucide-react"

export const dynamic = "force-dynamic"

const METRIC_LABELS: Record<string, string> = {
  weight:        "体重",
  body_fat:      "体脂肪率",
  muscle_mass:   "筋肉量",
  bmi:           "BMI",
  meal_calories: "カロリー",
  meal_protein:  "タンパク質",
  meal_fat:      "脂質",
  meal_carb:     "炭水化物",
}

const METRIC_UNITS: Record<string, string> = {
  weight: "kg", body_fat: "%", muscle_mass: "kg",
  meal_calories: "kcal", meal_protein: "g", meal_fat: "g", meal_carb: "g",
}

export default async function YomuPage() {
  const data = await fetchYomuData()
  const entries = data?.entries ?? []

  const grouped = groupHealthByMetric(entries, 30)
  const bodyScans = entries
    .filter((e) => e.type === "body_scan")
    .sort((a, b) => b.date.localeCompare(a.date))

  const healthMetrics = ["meal_calories", "meal_protein", "meal_fat", "meal_carb", "weight", "body_fat"]
  const activeMetrics = healthMetrics.filter((m) => grouped[m]?.values.length > 0)

  // 今日の栄養サマリー
  const todayStr = format(new Date(), "yyyyMMdd")
  const todayEntries = entries.filter((e) => e.type === "health" && e.date === todayStr)
  const todayCalories = todayEntries.filter((e) => e.metric === "meal_calories").reduce((s, e) => s + (e.value ?? 0), 0)
  const todayProtein  = todayEntries.filter((e) => e.metric === "meal_protein").reduce((s, e) => s + (e.value ?? 0), 0)

  return (
    <div className="page-container max-w-2xl">
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Droplets size={18} strokeWidth={1.5} style={{ color: "#3a6fc9" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">読雨</h1>
          <span className="text-xs font-mono text-dim ml-1">YOMU</span>
        </div>
        <p className="text-sm text-dim ml-7">健康・身体データの統合記録</p>
      </div>

      {/* 今日のサマリー */}
      {(todayCalories > 0 || todayProtein > 0) && (
        <div className="surface rounded-xl p-4 mb-6 animate-fade-in delay-100" style={{ borderLeft: "3px solid #3a6fc9" }}>
          <p className="text-xs text-dim mb-3">今日の摂取</p>
          <div className="flex gap-6">
            {todayCalories > 0 && (
              <div>
                <p className="text-2xl font-serif" style={{ color: "#3a6fc9" }}>{todayCalories}</p>
                <p className="text-xs text-dim">kcal</p>
              </div>
            )}
            {todayProtein > 0 && (
              <div>
                <p className="text-2xl font-serif" style={{ color: "#3a6fc9" }}>{todayProtein}g</p>
                <p className="text-xs text-dim">タンパク質</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 健康グラフ */}
      {activeMetrics.length > 0 && (
        <div className="space-y-5 mb-8 animate-fade-in delay-150">
          {activeMetrics.map((metric) => {
            const g = grouped[metric]
            return (
              <YomuHealthChart
                key={metric}
                label={METRIC_LABELS[metric] ?? metric}
                unit={METRIC_UNITS[metric] ?? g.unit}
                dates={g.dates}
                values={g.values}
              />
            )
          })}
        </div>
      )}

      {/* ボディスキャン */}
      {bodyScans.length > 0 && (
        <div className="animate-fade-in delay-200">
          <p className="section-label mb-4">🤳 ランク履歴</p>
          <div className="space-y-3">
            {bodyScans.map((e) => (
              <YomuBodyScan key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="surface rounded-xl py-16 text-center">
          <p className="text-sm text-faint">読雨のデータがまだありません</p>
        </div>
      )}

      <p className="text-xs text-faint text-center mt-8">
        データは読雨（YOMU）と自動同期 · 5分キャッシュ
      </p>
    </div>
  )
}
