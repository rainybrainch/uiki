"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { geocodeCity } from "@/lib/weather"

export async function saveCity(city: string): Promise<{ ok: boolean; error?: string; name?: string }> {
  const trimmed = city.trim()
  if (!trimmed) return { ok: false, error: "都市名を入力してください" }

  // Geocoding で lat/lon を解決
  const geo = await geocodeCity(trimmed)
  if (!geo) return { ok: false, error: `「${trimmed}」が見つかりませんでした` }

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { city: geo.name, lat: geo.lat, lon: geo.lon },
    create: { id: "singleton", city: geo.name, lat: geo.lat, lon: geo.lon },
  })

  revalidatePath("/")
  revalidatePath("/settings")
  return { ok: true, name: geo.name }
}

export async function generateApiKey(): Promise<{ key: string }> {
  const key = `uwiki_${crypto.randomUUID().replace(/-/g, "")}`
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { apiKey: key },
    create: { id: "singleton", apiKey: key },
  })
  revalidatePath("/settings")
  return { key }
}

export async function savePomojikanSettings(data: {
  url: string | null
  active: boolean
}): Promise<{ ok: boolean; error?: string }> {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { pomojikanUrl: data.url, pomojikanActive: data.active },
    create: {
      id: "singleton",
      pomojikanUrl: data.url,
      pomojikanActive: data.active,
    },
  })
  revalidatePath("/settings")
  return { ok: true }
}

export async function getSettings() {
  return prisma.settings.findUnique({ where: { id: "singleton" } })
}
