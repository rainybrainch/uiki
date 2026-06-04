import { fetchYomuData, groupHealthByMetric, yomuDateToIso } from "@/lib/yomu"
import { YomuHealthChart } from "@/components/yomu/YomuHealthChart"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { BookMarked, Star, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const METRIC_LABELS: Record<string, string> = {
  weight: "体重", body_fat: "体脂肪率", muscle_mass: "筋肉量", bmi: "BMI",
  meal_calories: "カロリー", meal_protein: "タンパク質", meal_fat: "脂質", meal_carb: "炭水化物",
}
const METRIC_UNITS: Record<string, string> = {
  weight: "kg", body_fat: "%", muscle_mass: "kg",
  meal_calories: "kcal", meal_protein: "g", meal_fat: "g", meal_carb: "g",
}

function Stars({ n }: { n?: number }) {
  if (!n) return null
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={10}
          style={{ color: i <= n ? "#c9a84c" : "rgba(255,255,255,0.12)",
                   fill: i <= n ? "#c9a84c" : "none" }} />
      ))}
    </div>
  )
}

function formatDate(d: string) {
  if (d.length === 8) d = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
  try { return format(new Date(d), "yyyy/MM/dd", { locale: ja }) } catch { return d }
}

export default async function YomuPage() {
  const data = await fetchYomuData()
  const entries = data?.entries ?? []

  const books = entries
    .filter((e) => e.type === "book" || e.type === "quote")
    .sort((a, b) => b.date.localeCompare(a.date))

  const grouped = groupHealthByMetric(entries, 30)
  const healthMetrics = ["weight", "body_fat", "meal_calories", "meal_protein"]
    .filter((m) => grouped[m]?.values.length > 0)

  const YOMU_URL = "https://rainybrainch.github.io/yomu/"

  return (
    <div className="page-container max-w-2xl">
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BookMarked size={18} strokeWidth={1.5} style={{ color: "#3a6fc9" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">読雨</h1>
          <span className="text-xs font-mono text-dim ml-1">YOMU</span>
          <a href={YOMU_URL} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-[10px] text-dim hover:text-white transition-colors">
            <ExternalLink size={10} /> サイトを開く
          </a>
        </div>
        <p className="text-sm text-dim ml-7">本・コンテンツの感想記録</p>
      </div>

      {/* 本・感想一覧 */}
      {books.length > 0 ? (
        <div className="space-y-3 mb-10 animate-fade-in delay-100">
          {books.map((b) => (
            <div key={b.id} className="surface rounded-xl p-4"
              style={{ borderLeft: "2px solid rgba(58,111,201,0.4)" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {b.title && (
                    <p className="text-sm font-medium leading-snug mb-0.5">{b.title}</p>
                  )}
                  {b.author && (
                    <p className="text-[11px] text-dim">{b.author}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Stars n={Number((b as any).stars) || undefined} />
                  <span className="text-[10px] text-faint">{formatDate(b.date)}</span>
                </div>
              </div>
              {b.text && (
                <p className="text-xs text-dim leading-relaxed">{b.text}</p>
              )}
              {b.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.tags.split(/[,、]/).map((t) => t.trim()).filter(Boolean).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(58,111,201,0.12)", color: "#3a6fc9" }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="surface rounded-xl py-12 text-center mb-10 animate-fade-in delay-100">
          <p className="text-sm text-faint mb-3">感想がまだありません</p>
          <a href={YOMU_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "rgba(58,111,201,0.12)", color: "#3a6fc9" }}>
            読雨サイトで感想を書く →
          </a>
        </div>
      )}

      {/* 健康データ（サブ） */}
      {healthMetrics.length > 0 && (
        <div className="animate-fade-in delay-200">
          <p className="section-label mb-4">身体データ（直近30日）</p>
          <div className="space-y-4">
            {healthMetrics.map((metric) => {
              const g = grouped[metric]
              return (
                <YomuHealthChart key={metric}
                  label={METRIC_LABELS[metric] ?? metric}
                  unit={METRIC_UNITS[metric] ?? g.unit}
                  dates={g.dates} values={g.values} />
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-faint text-center mt-8">
        データは読雨（YOMU）Gist と自動同期 · 5分キャッシュ
      </p>
    </div>
  )
}
