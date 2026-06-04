import { PrismaClient } from "./generated/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neon } from "@neondatabase/serverless"

function createPrisma() {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL)
    const adapter = new PrismaNeon(sql as any)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    } as any) as unknown as PrismaClient
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export * from "./generated/client"
