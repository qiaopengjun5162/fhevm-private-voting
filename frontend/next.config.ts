import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zama-fhe/relayer-sdk"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
