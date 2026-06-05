import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const [tasks, habits, habitLogs, diaries, cases, dreams, personas, youtubeSources, projects] = await Promise.all([
      prisma.task.findMany({ include: { subtasks: true } }),
      prisma.habit.findMany(),
      prisma.habitLog.findMany({ orderBy: { date: "desc" }, take: 365 }),
      prisma.diaryEntry.findMany({ orderBy: { date: "desc" }, take: 365 }),
      prisma.case.findMany(),
      prisma.dream.findMany(),
      prisma.commentPersona.findMany(),
      prisma.personaYoutubeSource.findMany(),
      prisma.project.findMany(),
    ])

    const backup = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      data: { tasks, habits, habitLogs, diaries, cases, dreams, personas, youtubeSources, projects },
    }

    const gistId = process.env.BACKUP_GIST_ID
    const githubToken = process.env.GITHUB_TOKEN
    if (gistId && githubToken) {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: {
            "uwiki-backup.json": { content: JSON.stringify(backup, null, 2) },
          },
        }),
      })
    }

    return NextResponse.json({
      ok: true,
      counts: {
        tasks: tasks.length,
        habits: habits.length,
        diaries: diaries.length,
        cases: cases.length,
        dreams: dreams.length,
        personas: personas.length,
      },
    })
  } catch (e: any) {
    console.error("[backup] failed:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
