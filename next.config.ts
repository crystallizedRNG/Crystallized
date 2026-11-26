import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Crystallized",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
