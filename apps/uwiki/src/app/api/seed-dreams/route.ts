import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// 一時的なシードエンドポイント — 使用後削除
export async function POST(req: Request) {
  const { secret } = await req.json()
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // No.5（RB-Tree 配信フロー）→ No.10 に移動
  const no5 = await prisma.dream.findFirst({ where: { layer: 5 } })
  let moved = null
  if (no5) {
    await prisma.dream.update({ where: { id: no5.id }, data: { layer: 10, category: "BUSINESS" } })
    moved = `${no5.title}: No.5 → No.10`
  }

  // No.1・No.2 を upsert
  const dreams = [
    {
      id: "dream-no1-hyakuso",
      title: "百層世界",
      definition: "福井紫耀（服牢井像/ふくろう/オール・ドメディア）が、人生をかけて創り上げる100個の独立した夢の世界。複数の名義・側面を持ち、各世界を手がけることで、創作を通じて未来を作り、人生の集大成を構築するもの。",
      vision: "「仙人」という文化的アイコンになる。泥雨生命理論を完全に実装し、服牢井像を現実化する。代表作を生み出し、人生の集大成を完成させること。",
      vow: "100個すべての世界を定義し、完全に支配する。各世界を投げ出さず、誓い続ける。すべての世界をテンプレートに沿って定義する。各世界の誓約と制約を絶対に守る。",
      constraints: "限られた人生の中で、優先順位をつけながら実現する。泥雨生命理論に基づく完全性を保つ。",
      period: "死ぬまで。その過程で、必ず代表作を生み出す。",
      kpi: "代表作の存在。人生の集大成の完成。仙人というアイコンの確立。",
      connections: "雨域/Uwiki, 全100世界",
      category: "OATH" as const,
      layer: 1,
      progress: 30,
      order: 0,
    },
    {
      id: "dream-no2-uwiki",
      title: "雨域/Uwiki",
      definition: "RAINY BRAINの全プロジェクト・習慣・案件・夢を一元管理するパーソナルOS。百層世界の1つであり、同時に全100世界の中枢管理システム。",
      vision: "静かな自己管理OSとして、創作活動の基盤となる。すべての世界がここを通じて動く。",
      vow: "毎日使える実用的なツールであり続ける。百層世界との連携を維持し続ける。",
      constraints: "UIは常にシンプル・高速。過剰な機能追加をしない。",
      period: "継続開発・永続運用",
      kpi: "daily active use。全機能の実運用率。百層世界との連携完成度。",
      connections: "百層世界, ぽもじかん, マネぼう, 電脳世界, 雨と世界",
      category: "PROJECT" as const,
      layer: 2,
      progress: 60,
      order: 1,
    },
  ]

  const results = []
  for (const dream of dreams) {
    await prisma.dream.upsert({
      where: { id: dream.id },
      create: dream,
      update: dream,
    })
    results.push({ upserted: dream.title })
  }

  // 現在の全データを返す
  const all = await prisma.dream.findMany({
    orderBy: { layer: "asc" },
    select: { layer: true, title: true, category: true, progress: true },
  })

  return NextResponse.json({ ok: true, moved, results, all })
}
