import type { MetadataRoute } from "next";
import { caseStudies, industries, insights, locations, services } from "@/lib/content";
import { SITE } from "@/lib/site";

const staticRoutes = [
  "",
  "/services",
  "/work",
  "/industries",
  "/approach",
  "/about",
  "/studio",
  "/insights",
  "/locations",
  "/estimate",
  "/start-a-project",
  "/contact",
  "/accessibility",
  "/privacy",
  "/cookies",
  "/terms",
] as const;

function absoluteUrl(pathname: string): string {
  return new URL(pathname || "/", SITE.url).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((pathname) => ({
    url: absoluteUrl(pathname),
    changeFrequency: pathname === "" ? "weekly" : "monthly",
    priority: pathname === "" ? 1 : pathname === "/services" || pathname === "/work" ? 0.9 : 0.7,
  }));

  const serviceEntries: MetadataRoute.Sitemap = services.map(({ slug }) => ({
    url: absoluteUrl(`/services/${slug}`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const industryEntries: MetadataRoute.Sitemap = industries.map(({ slug }) => ({
    url: absoluteUrl(`/industries/${slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const workEntries: MetadataRoute.Sitemap = caseStudies.map(({ slug }) => ({
    url: absoluteUrl(`/work/${slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const insightEntries: MetadataRoute.Sitemap = insights.map(({ slug }) => ({
    url: absoluteUrl(`/insights/${slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const locationEntries: MetadataRoute.Sitemap = locations.map(({ slug }) => ({
    url: absoluteUrl(`/locations/${slug}`),
    changeFrequency: "monthly",
    priority: slug === "st-johns" ? 0.8 : 0.6,
  }));

  return [
    ...staticEntries,
    ...serviceEntries,
    ...industryEntries,
    ...workEntries,
    ...insightEntries,
    ...locationEntries,
  ];
}
