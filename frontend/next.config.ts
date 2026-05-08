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
    // 强制 Turbopack 只在前端目录解析
    resolveAlias: {
      // 确保 tailwindcss 从正确位置加载
      tailwindcss: require.resolve("tailwindcss"),
    },
  },
}

export default nextConfig
