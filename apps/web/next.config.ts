import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@watchlight/shared", "@watchlight/db"],
};

export default nextConfig;
