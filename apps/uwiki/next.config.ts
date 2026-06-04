import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@uwiki/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    outputFileTracingIncludes: {
      "/**": [
        "../../packages/database/src/generated/client/**",
        "../../node_modules/.prisma/client/**",
      ],
    },
  },
}

export default nextConfig
