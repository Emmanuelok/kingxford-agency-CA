import type { MetadataRoute } from "next";
import { WORKSPACE_ENABLED } from "@/lib/release";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", ...(!WORKSPACE_ENABLED ? ["/studio", "/platform", "/tools"] : [])] },
    sitemap: "https://kingxford-agency-ca.vercel.app/sitemap.xml",
  };
}
