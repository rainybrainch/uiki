import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Layers, CheckCircle2 } from "lucide-react"
import { DreamDetailClient } from "@/components/dreams/DreamDetailClient"
import type { Task } from "@uwiki/database"

export const dynamic = "force-dynamic"

const CAT_LABELS: Record<string, string> = {
  OATH: "十二の誓い", CREATIVE: "創作（個人）", BODY: "身体・修行",
  HABIT: "習慣・継続", PROJECT: "プロジェクト（RB）", BUSINESS: "事業・収益", OTHER: "その他",
}
const CAT_COLORS: Record<string, string> = {
  OATH: "#c9a84c", PROJECT: "#3a6fc9", HABIT: "#4ade80",
  BODY: "#f87171", BUSINESS: "#f59e0b", CREATIVE: "#8b5cf6", OTHER: "#94a3b8",
}
const AXIS_LABELS: Record<string, { label: string; color: string }> = {
  RICE1: { label: "ライスワーク①", color: "#f59e0b" },
  RICE2: { label: "ライスワーク②", color: "#3a6fc9" },
  LIFE1: { label: "ライフワーク①", color: "#8b5cf6" },
  LIFE2: { label: "ライフワーク②", color: "#f472b6" },
}

export default async function DreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const dream = await prisma.dream.findUnique({ where: { id } })
  if (!dream) notFound()

  const linkedTasks = await prisma.task.findMany({
    where: { dreamId: id },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    include: { project: { select: { id: true, name: true, color: true } } },
  }) as (Task & { project: { id: string; name: string; color: string } | null })[]

  const axis = dream.axis ? AXIS_LABELS[dream.axis] : null
  const catColor = CAT_COLORS[dream.category] ?? "#94a3b8"
  const catLabel = CAT_LABELS[dream.category] ?? dream.category

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 md:px-8 md:py-10">
      {/* 戻る */}
      <Link href="/dreams" className="inline-flex items-center gap-1.5 text-xs text-dim hover:text-white transition-colors mb-6">
        <ArrowLeft size={13} />
        百層世界
      </Link>

      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>
            {catLabel}
          </span>
          {axis && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: `${axis.color}15`, color: axis.color, border: `1px solid ${axis.color}28` }}>
              {axis.label}
            </span>
          )}
          <span className="text-[10px] font-mono text-faint">Layer {dream.layer}</span>
          {dream.achieved && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.12)", color: "var(--green)", border: "1px solid rgba(74,222,128,0.25)" }}>
              <CheckCircle2 size={10} />
              達成
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-light tracking-wide leading-snug mb-4">
          {dream.title}
        </h1>

        {/* 進捗 + インタラクション + フィールド編集 */}
        <DreamDetailClient
          id={dream.id}
          progress={dream.progress}
          achieved={dream.achieved}
          catColor={catColor}
          dream={dream}
        />
      </div>


      {/* 紐づきタスク */}
      {linkedTasks.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-mono tracking-widest text-faint mb-3">LINKED TASKS</p>
          <div className="space-y-1">
            {linkedTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: task.completed ? "var(--faint)" : "var(--accent)" }} />
                {task.project && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: task.project.color }} />
                )}
                <span className="flex-1 text-sm truncate"
                  style={{ opacity: task.completed ? 0.4 : 1, textDecoration: task.completed ? "line-through" : "none" }}>
                  {task.title}
                </span>
                {task.project && (
                  <span className="text-[10px] text-faint shrink-0">{task.project.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {linkedTasks.length === 0 && (
        <div className="mb-8 rounded-xl p-4 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border)" }}>
          <p className="text-xs text-faint mb-2">このワールドに紐づくタスクがありません</p>
          <Link href="/tasks" className="text-xs hover:text-accent transition-colors" style={{ color: "var(--dim)" }}>
            タスクから「ワールドに追加」できます →
          </Link>
        </div>
      )}
    </div>
  )
}
