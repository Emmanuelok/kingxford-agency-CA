import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const origin="https://kingxford-agency-ca.vercel.app";return ["","/services","/solutions","/studio","/studio/workbench","/platform","/tools","/industries","/about","/pricing","/start","/privacy","/accessibility","/responsible-advertising"].map(path=>({url:new URL(path||"/",origin).href}));}
