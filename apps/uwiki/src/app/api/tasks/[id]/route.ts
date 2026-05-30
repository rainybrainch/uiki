import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

async function authenticate(req: NextRequest): Promise<boolean> {
  const key = req.headers.get("authorization")?.slice(7)
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
  return settings?.apiKey === key
}

/**
 * GET /api/tasks/[id]
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const task = await prisma.task.findUnique({
    where: { id },
    include: { subtasks: { orderBy: { order: "asc" } }, project: true },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ task })
}

/**
 * PATCH /api/tasks/[id]
 * Body: 更新したいフィールドのみ
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title     !== undefined ? { title: body.title }                       : {}),
      ...(body.memo      !== undefined ? { memo: body.memo }                         : {}),
      ...(body.priority  !== undefined ? { priority: body.priority }                 : {}),
      ...(body.column    !== undefined ? { column: body.column, completed: body.column === "done" } : {}),
      ...(body.completed !== undefined ? { completed: body.completed }               : {}),
      ...(body.dueDate   !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.tags      !== undefined ? { tags: body.tags }                         : {}),
      ...(body.projectId !== undefined ? { projectId: body.projectId }               : {}),
    },
    include: { subtasks: true },
  })
  return NextResponse.json({ task })
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
