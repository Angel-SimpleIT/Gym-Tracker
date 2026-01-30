import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // @ts-expect-error - Some types might be missing in canary versions
    ignoreBuildErrors: true,
  },
  eslint: {
    // @ts-expect-error
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
