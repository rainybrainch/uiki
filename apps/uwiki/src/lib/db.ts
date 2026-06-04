import { PrismaClient } from "../generated/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neon } from "@neondatabase/serverless"

function createPrisma() {
  const sql = neon(process.env.DATABASE_URL!)
  const adapter = new PrismaNeon(sql as any)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as any)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
