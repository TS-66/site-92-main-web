import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is only needed for self-hosting (Docker/VPS).
  // On Vercel it conflicts with Vercel's own build/output handling.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
