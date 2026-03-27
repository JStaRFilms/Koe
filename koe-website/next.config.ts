import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  trailingSlash: true,
};

export default nextConfig;
