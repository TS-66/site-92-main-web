import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return {
      beforeFiles: [
        // Serve the SCiPNET terminal shell at the root URL.
        { source: "/", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;
