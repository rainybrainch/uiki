import { prisma } from "@/lib/db"
import type { CommentPersona, PersonaYoutubeSource } from "@uwiki/database"
import { PersonaList } from "@/components/personas/PersonaList"
import { PersonaForm } from "@/components/personas/PersonaForm"
import { YoutubeSourceSection } from "@/components/personas/YoutubeSourceSection"

export const dynamic = "force-dynamic"

export default async function PersonasPage() {
  let personas: CommentPersona[] = []
  let youtubeSources: PersonaYoutubeSource[] = []

  try {
    personas = await prisma.commentPersona.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (e) { console.error("[page] DB query failed:", e) }

  try {
    youtubeSources = await prisma.personaYoutubeSource.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (e) { console.error("[page] DB query failed:", e) }

  const enabledCount = personas.filter((p) => p.enabled).length

  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>🎭 コメント人格</h1>
          <p style={{ color: "var(--fg-muted, #888)", fontSize: 12, marginTop: 4 }}>
            全配信画面で使用される AI コメント人格を管理する
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
            background: "rgba(160,180,255,.15)", color: "#a0b4ff", border: "1px solid rgba(160,180,255,.3)"
          }}>
            {enabledCount} 人有効 / 計 {personas.length} 人
          </span>
        </div>
      </div>

      {/* 人格追加フォーム */}
      <PersonaForm />

      {/* 人格一覧 */}
      <PersonaList personas={personas} />

      {/* YouTube URLストック */}
      <YoutubeSourceSection sources={youtubeSources} />
    </div>
  )
}
