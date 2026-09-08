import type { MetadataRoute } from "next";
import { WORKSPACE_ENABLED } from "@/lib/release";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = "https://kingxford-agency-ca.vercel.app";
  const paths = ["", "/services", "/solutions", "/projects", "/industries", "/about", "/pricing", "/start", "/privacy", "/accessibility", "/responsible-advertising"];
  if (WORKSPACE_ENABLED) paths.push("/studio", "/studio/workbench", "/platform", "/tools");
  return paths.map((path) => ({ url: new URL(path || "/", origin).href }));
}
