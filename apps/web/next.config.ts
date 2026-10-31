import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@watchlight/shared", "@watchlight/db"],
};

export default nextConfig;
