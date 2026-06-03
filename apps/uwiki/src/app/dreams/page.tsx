import { prisma } from "@/lib/db"
import { DreamList } from "@/components/dreams/DreamList"
import { DreamForm } from "@/components/dreams/DreamForm"
import { Layers } from "lucide-react"

export const dynamic = "force-dynamic"

const CAT_LABELS: Record<string, string> = {
  OATH:     "十二の誓い",
  CREATIVE: "創作（個人）",
  BODY:     "身体・修行",
  HABIT:    "習慣・継続",
  PROJECT:  "プロジェクト（RB）",
  BUSINESS: "事業・収益",
  OTHER:    "その他",
}

const CAT_COLORS: Record<string, string> = {
  OATH:     "#c9a84c",
  PROJECT:  "#3a6fc9",
  HABIT:    "#4ade80",
  BODY:     "#f87171",
  BUSINESS: "#f59e0b",
  CREATIVE: "#8b5cf6",
  OTHER:    "#94a3b8",
}

export default async function DreamsPage() {
  let dreams: any[] = []
  try {
    dreams = await prisma.dream.findMany({ orderBy: [{ achieved: "asc" }, { layer: "asc" }, { order: "asc" }] })
  } catch {}

  // ルート定義（百層世界自体）を分離
  const rootDream = dreams.find((d) => d.id === "hyakuso-root")
  const total = 100
  const achieved = dreams.filter((d) => d.achieved && d.id !== "hyakuso-root").length
  const active = dreams.filter((d) => !d.achieved && d.id !== "hyakuso-root")
  const done = dreams.filter((d) => d.achieved && d.id !== "hyakuso-root")
  const pct = Math.round((achieved / total) * 100)

  const byCategory = Object.keys(CAT_LABELS).map((cat) => ({
    cat,
    label: CAT_LABELS[cat],
    color: CAT_COLORS[cat],
    dreams: active.filter((d) => d.category === cat),
  })).filter((g) => g.dreams.length > 0)

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <Layers size={20} strokeWidth={1.5} style={{ color: "#8b5cf6" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">百層世界</h1>
          <span className="text-xs font-mono text-dim ml-1">{dreams.length}/100</span>
        </div>

        {/* ルート定義カード */}
        {rootDream && (
          <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(139,92,246,0.08)", border: "1.5px solid rgba(139,92,246,0.4)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono tracking-widest" style={{ color: "#8b5cf6" }}>ROOT DEFINITION</span>
            </div>
            <p className="text-sm font-serif font-light leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
              {rootDream.vision}
            </p>
            <p className="text-xs text-dim leading-relaxed border-t pt-2 mt-2" style={{ borderColor: "rgba(139,92,246,0.2)" }}>
              {rootDream.vow?.split("。")[0]}。
            </p>
          </div>
        )}

        {/* 進捗バー */}
        <div className="rounded-xl p-5 mb-4" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-dim mb-1">達成した層</p>
              <p className="text-3xl font-serif font-light" style={{ color: "#8b5cf6" }}>
                {achieved} <span className="text-lg text-dim">/ {total}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-serif font-light" style={{ color: "#8b5cf6" }}>{pct}%</p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(dreams.length / 100) * 100}%`, background: "rgba(139,92,246,0.4)" }}
            />
            <div
              className="h-full rounded-full transition-all duration-700 -mt-2"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #8b5cf6, #a78bfa)" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs font-mono text-dim">
            <span>入力済み {dreams.length}層</span>
            <span>達成 {achieved}層</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8 md:pb-12">
        <div className="mb-6">
          <DreamForm catLabels={CAT_LABELS} />
        </div>

        {/* 世界が少ない時のヒント */}
        {active.length < 5 && (
          <div className="mb-6 rounded-xl p-4" style={{ background: "rgba(139,92,246,0.04)", border: "1px dashed rgba(139,92,246,0.2)" }}>
            <p className="text-xs text-dim mb-3">十二の誓いから世界を掘ってみる：</p>
            <div className="flex flex-wrap gap-2">
              {[
                "RAINY BRAIN起業", "マネぼう", "RA'I'NA", "雨と世界",
                "ぽもじかん", "電脳世界", "SASUKE完全制覇", "ボカロP活動",
                "VTuber活動", "法人化+書店", "Blender 3D", "音楽制作",
              ].filter((name) => !active.find((d: any) => d.title === name)).slice(0, 6).map((name) => (
                <span key={name} className="text-xs px-2.5 py-1 rounded-full cursor-default"
                  style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <DreamList byCategory={byCategory} done={done} catColors={CAT_COLORS} catLabels={CAT_LABELS} />
      </div>
    </div>
  )
}
