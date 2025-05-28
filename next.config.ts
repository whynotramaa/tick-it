import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "youthful-fox-952.convex.cloud"
      }
    ]
  }
};

export default nextConfig;
