import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    transpilePackages: ["@zama-fhe/relayer-sdk"],
    turbopack: {
        // 强制 Turbopack 只在前端目录解析
        resolveAlias: {
            // 确保 tailwindcss 从正确位置加载
            tailwindcss: require.resolve("tailwindcss"),
        },
    },




}

export default nextConfig
