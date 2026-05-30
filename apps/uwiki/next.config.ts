import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@ameiki/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
}

export default nextConfig
