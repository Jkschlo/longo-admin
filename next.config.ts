import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // ✅ Explicitly set this folder as the workspace root
  turbopack: {
    root: "./",
  },

  // (Optional but helpful) - ensures consistent builds on Windows paths
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
