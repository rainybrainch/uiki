"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { runGeneration, syncAllToGist } from "@/lib/persona-generate"

// ── 人格 CRUD ─────────────────────────────────────────
export async function createPersona(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "名前は必須です" }

  await prisma.commentPersona.create({
    data: {
      name,
      roleType:    (formData.get("roleType") as string) || "共感勢",
      catchphrase: (formData.get("catchphrase") as string)?.trim() || "",
      color:       (formData.get("color") as string) || "#a0b4ff",
      words:       (formData.get("words") as string)?.trim() || "",
      genres:      (formData.get("genres") as string)?.trim() || "",
      tags:        (formData.get("tags") as string)?.trim() || "",
      tone:        (formData.get("tone") as string)?.trim() || "",
      enabled:     true,
    }
  })

  await syncAllToGist()
  revalidatePath("/personas")
  return { ok: true }
}

export async function togglePersona(id: string, enabled: boolean) {
  await prisma.commentPersona.update({ where: { id }, data: { enabled } })
  await syncAllToGist()
  revalidatePath("/personas")
}

export async function deletePersona(id: string) {
  await prisma.commentPersona.delete({ where: { id } })
  await syncAllToGist()
  revalidatePath("/personas")
}

// ── YouTube ソース管理 ──────────────────────────────────
export async function addYoutubeSource(formData: FormData) {
  const url = (formData.get("url") as string)?.trim()
  if (!url) return { error: "URLは必須です" }

  await prisma.personaYoutubeSource.create({
    data: {
      url,
      description:  (formData.get("description") as string)?.trim() || "",
      streamGenres: (formData.get("streamGenres") as string)?.trim() || "",
    }
  })
  revalidatePath("/personas")
  return { ok: true }
}

export async function deleteYoutubeSource(id: string) {
  await prisma.personaYoutubeSource.delete({ where: { id } })
  revalidatePath("/personas")
}

// ── YouTube → Gemini AI 人格生成 ─────────────────────────
export async function generatePersonasFromSource(sourceId: string) {
  const source = await prisma.personaYoutubeSource.findUnique({ where: { id: sourceId } })
  if (!source) return { error: "ソースが見つかりません" }

  await prisma.personaYoutubeSource.update({
    where: { id: sourceId },
    data: { genStatus: "pending", genError: null },
  })

  const result = await runGeneration(source)

  if (result.error) {
    await prisma.personaYoutubeSource.update({
      where: { id: sourceId },
      data: { genStatus: "failed", genError: result.error },
    })
  } else {
    await prisma.personaYoutubeSource.update({
      where: { id: sourceId },
      data: {
        genStatus: "done",
        genError: null,
        lastGenerated: new Date(),
        personaCount: { increment: result.created ?? 0 },
      },
    })
  }

  revalidatePath("/personas")
  return result
}
