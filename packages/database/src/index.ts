import { PrismaClient } from "./generated/client"
import { PrismaNeon } from "@prisma/adapter-neon"

function createPrisma() {
  if (process.env.DATABASE_URL) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL } as any)
    return new PrismaClient({ adapter } as any) as unknown as PrismaClient
  }
  return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export * from "./generated/client"
