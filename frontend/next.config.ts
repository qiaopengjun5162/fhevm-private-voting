import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@zama-fhe/relayer-sdk"],
  // COOP/COEP headers required for @zama-fhe/relayer-sdk Web Workers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ]
  },
  turbopack: {
    // 只扫描 frontend 目录，不向上找 repo root 的 package-lock.json
    root: __dirname,
  },
}

export default nextConfig
