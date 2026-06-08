import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import type { Prisma } from "@uwiki/database"

async function authenticate(req: NextRequest): Promise<boolean> {
  const key = req.headers.get("authorization")?.slice(7)
  if (!key) return false
  try {
    const settings = await prisma.settings.findUnique({ where: { id: "singleton" } })
    return !!settings?.apiKey && settings.apiKey === key
  } catch {
    return false
  }
}

/** GET /api/tasks/[id] */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { subtasks: { orderBy: { order: "asc" } }, project: true },
    })
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ task })
  } catch (e) {
    console.error("[GET /api/tasks/id]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/** PATCH /api/tasks/[id] */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  type PatchTaskBody = {
    title?: string; memo?: string; priority?: string; column?: string
    completed?: boolean; dueDate?: string | null; tags?: string; projectId?: string | null
  }
  let body: PatchTaskBody
  try { body = await req.json() as PatchTaskBody } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title     !== undefined ? { title: body.title }     : {}),
        ...(body.memo      !== undefined ? { memo: body.memo }       : {}),
        ...(body.priority  !== undefined ? { priority: body.priority } : {}),
        ...(body.column    !== undefined ? { column: body.column, completed: body.column === "done" } : {}),
        // column が同時に指定された場合は column 側を優先するため completed は無視
        ...(body.completed !== undefined && body.column === undefined ? { completed: body.completed } : {}),
        ...(body.dueDate   !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
        ...(body.tags      !== undefined ? { tags: body.tags }       : {}),
        ...(body.projectId !== undefined ? { projectId: body.projectId } : {}),
      } as Prisma.TaskUncheckedUpdateInput,
      include: { subtasks: true },
    })
    return NextResponse.json({ task })
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error("[PATCH /api/tasks/id]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/** DELETE /api/tasks/[id] */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error("[DELETE /api/tasks/id]", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
