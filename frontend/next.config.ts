import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zama-fhe/relayer-sdk"],
  // Vercel tsc can't resolve @/* path aliases. Webpack resolves them correctly.
  typescript: {
    ignoreBuildErrors: true,
  },
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
    ];
  },
};

export default nextConfig;
