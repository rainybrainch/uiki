import { PrismaClient } from "../../packages/database/src/generated/client"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Jic4FMBQaVH3@ep-shy-rain-a6ia98hv.us-west-2.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      city: "Bunkyo, Tokyo",
      lat: 35.7081,
      lon: 139.7527,
      pomojikanUrl: "https://rainybrainch.github.io/pomojikan/",
      pomojikanActive: true,
    },
    create: {
      id: "singleton",
      city: "Bunkyo, Tokyo",
      lat: 35.7081,
      lon: 139.7527,
      pomojikanUrl: "https://rainybrainch.github.io/pomojikan/",
      pomojikanActive: true,
    },
  })
  console.log("✓ 文京区・ぽもじかん設定完了")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
