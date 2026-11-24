import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build output goes to `dist`, which is the publish directory configured in netlify.toml.
  distDir: "dist",
};

export default nextConfig;
