import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { Priority } from "@uwiki/database"
import { ai } from "@/lib/ai"

async function authenticate(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return false
  const key = authHeader.slice(7)
  if (!key) return false  // 空文字列を弾く
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
    return !!settings?.apiKey && settings.apiKey === key
  } catch {
    return false
  }
}

/** GET /api/tasks */
export async function GET(req: NextRequest) {
  if (!await authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("project")
  const column    = searchParams.get("column")
  const completed = searchParams.get("completed")
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId  ? { projectId }  : {}),
        ...(column     ? { column }     : {}),
        ...(completed !== null ? { completed: completed === "true" } : {}),
      },
      include: {
        subtasks: { orderBy: { order: "asc" } },
        project:  { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: limit,
    })
    return NextResponse.json({ tasks, count: tasks.length })
  } catch (e) {
    console.error("[GET /api/tasks]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/** POST /api/tasks */
export async function POST(req: NextRequest) {
  if (!await authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  type CreateTaskBody = {
    title?: string; memo?: string; tags?: string; priority?: Priority
    dueDate?: string; column?: string; projectId?: string
  }
  let body: CreateTaskBody
  try { body = await req.json() as CreateTaskBody } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  // メールタグがある場合はGeminiで自動要約
  let memo = body.memo ?? null
  if (body.tags?.includes("メール") && body.memo) {
    try {
      const summary = await ai.flash(
        `以下のメール内容を日本語で2〜3文に要約してください。要約のみ出力してください。\n\n${body.memo}`
      )
      if (summary) memo = summary
    } catch {
      // 要約失敗時はそのまま保存
    }
  }

  try {
    const task = await prisma.task.create({
      data: {
        title:     String(body.title),
        memo:      memo,
        priority:  body.priority ?? "MEDIUM",
        dueDate:   body.dueDate ? new Date(body.dueDate) : null,
        column:    body.column ?? "todo",
        tags:      body.tags ?? null,
        projectId: body.projectId ?? null,
      },
      include: { subtasks: true, project: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ task }, { status: 201 })
  } catch (e) {
    console.error("[POST /api/tasks]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
