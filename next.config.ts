import type { NextConfig } from "next";

// The site is a static export for GitHub Pages. For a project site the address is
// https://<user>.github.io/<repo>/, so NEXT_PUBLIC_BASE_PATH is "/<repo>" (set by the deploy workflow).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Address used in search links (canonical, hreflang, sitemap). Vercel provides the production domain at build time,
// so the live site needs no settings; NEXT_PUBLIC_SITE_URL still wins when it is set.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  env: { SITE_URL: siteUrl },
  experimental: { globalNotFound: true },
};

export default nextConfig;
