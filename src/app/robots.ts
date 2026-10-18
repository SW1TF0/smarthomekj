import type { MetadataRoute } from "next";
import { absoluteUrl, basePath } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: `${basePath}/admin/` },
    sitemap: absoluteUrl(`${basePath}/sitemap.xml`),
  };
}
