import { prisma } from "@/lib/db"
import { LibraryList } from "@/components/library/LibraryList"
import { LibraryAddForm } from "@/components/library/LibraryAddForm"
import { LibraryFilter } from "@/components/library/LibraryFilter"
import { Library } from "lucide-react"
import type { ItemType, ItemStatus } from "@ameiki/database"

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

  const items = await prisma.libraryItem.findMany({
    where: {
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  // 件数サマリー
  const all = await prisma.libraryItem.findMany({ select: { type: true, status: true } })
  const typeCounts = Object.fromEntries(
    Object.keys(TYPE_LABELS).map((t) => [t, all.filter((i) => i.type === t).length])
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-8 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <Library size={20} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
          <h1 className="text-2xl font-serif font-light tracking-wide">ライブラリ</h1>
          <span className="text-xs font-mono ml-2" style={{ color: "var(--dim)" }}>
            {all.length} 件
          </span>
        </div>

        <LibraryFilter typeLabels={TYPE_LABELS} typeCounts={typeCounts} current={{ type: typeFilter, status: statusFilter }} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-12">
        <div className="mb-6">
          <LibraryAddForm typeLabels={TYPE_LABELS} />
        </div>
        <LibraryList items={items} typeLabels={TYPE_LABELS} />
      </div>
    </div>
  )
}
