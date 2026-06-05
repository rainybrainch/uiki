import { prisma } from "@/lib/db"
import { LibraryList } from "@/components/library/LibraryList"
import { LibraryAddForm } from "@/components/library/LibraryAddForm"
import { LibraryFilter } from "@/components/library/LibraryFilter"
import { Library } from "lucide-react"
import type { ItemType, ItemStatus } from "@uwiki/database"

export const dynamic = "force-dynamic"

const TYPE_LABELS: Record<string, string> = {
  BOOK: "📚 本",
  MOVIE: "🎬 映画",
  MUSIC: "🎵 音楽",
  GAME: "🎮 ゲーム",
  YOUTUBE: "▶ YouTube",
  ARTICLE: "📄 記事",
  URL: "🔗 リンク",
  OTHER: "◉ その他",
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const params = await searchParams
  const typeFilter = params.type as ItemType | undefined
  const statusFilter = params.status as ItemStatus | undefined

  let items: any[] = []
  let all: any[] = []
  try {
    ;[items, all] = await Promise.all([
      prisma.libraryItem.findMany({
        where: {
          ...(typeFilter ? { type: typeFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.libraryItem.findMany({ select: { type: true, status: true } }),
    ])
  } catch {
    // DB未接続時はデフォルト値
  }
  const typeCounts: Record<string, number> = {}
  for (const item of all) {
    typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1
  }

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
      <div className="px-4 py-5 md:px-8 md:py-8 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <Library size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">ライブラリ</h1>
          <span className="text-xs font-mono ml-2" style={{ color: "var(--dim)" }}>
            {all.length} 件
          </span>
        </div>

        <LibraryFilter typeLabels={TYPE_LABELS} typeCounts={typeCounts} current={{ type: typeFilter, status: statusFilter }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8 md:pb-12">
        <div className="mb-6">
          <LibraryAddForm typeLabels={TYPE_LABELS} />
        </div>
        <LibraryList items={items} typeLabels={TYPE_LABELS} />
      </div>
    </div>
  )
}
