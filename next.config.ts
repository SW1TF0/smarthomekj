import type { NextConfig } from "next";

// The site is a static export for GitHub Pages. For a project site the address is
// https://<user>.github.io/<repo>/, so NEXT_PUBLIC_BASE_PATH is "/<repo>" (set by the deploy workflow).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  experimental: { globalNotFound: true },
};

export default nextConfig;
