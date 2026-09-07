import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/api/"]},sitemap:"https://kingxford-agency-ca.vercel.app/sitemap.xml"};}
