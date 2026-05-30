import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// シンプルなAPIキー認証
async function authenticate(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return false

  const key = authHeader.slice(7)
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
  return settings?.apiKey === key
}

/**
 * GET /api/tasks
 * クエリ: ?project=<id>&column=todo|doing|done&completed=false&limit=50
 */
export async function GET(req: NextRequest) {
  if (!await authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const projectId  = searchParams.get("project")
  const column     = searchParams.get("column")
  const completed  = searchParams.get("completed")
  const limit      = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectId  ? { projectId }                 : {}),
      ...(column     ? { column }                    : {}),
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
}

/**
 * POST /api/tasks
 * Body: { title, memo?, priority?, dueDate?, column?, tags?, projectId? }
 */
export async function POST(req: NextRequest) {
  if (!await authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      title:     body.title,
      memo:      body.memo,
      priority:  body.priority ?? "MEDIUM",
      dueDate:   body.dueDate ? new Date(body.dueDate) : null,
      column:    body.column ?? "todo",
      tags:      body.tags,
      projectId: body.projectId,
    },
    include: { subtasks: true, project: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ task }, { status: 201 })
}
