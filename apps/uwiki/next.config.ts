import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@uwiki/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    outputFileTracingIncludes: {
      "/**": ["./src/generated/client/**"],
    },
  },
}

export default nextConfig
