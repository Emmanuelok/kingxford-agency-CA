const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const fallbackSiteUrl = vercelProductionHost
  ? `https://${vercelProductionHost}`
  : "http://localhost:3000";

export const SITE = {
  name: "KINGXFORD",
  legalName: "KINGXFORD Agency",
  description:
    "An independent St. John’s agency uniting strategy, creative, production, digital products, media and measurable growth.",
  url: process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl,
  location: "St. John’s, Newfoundland and Labrador",
  cinematicVideoUrl:
    process.env.NEXT_PUBLIC_CINEMATIC_VIDEO_URL || "/media/kingxford-cinematic-hero.mp4",
  cinematicVideoMobileUrl: "/media/kingxford-cinematic-hero-mobile.mp4",
  cinematicPosterUrl: "/media/kingxford-cinematic-poster.jpg",
  images: {
    homeStrategy: "/media/kingxford-production-system.webp",
    conceptOcean: "/media/kingxford-canadian-industries.webp",
    conceptTravel: "/media/kingxford-atlantic-studio.webp",
    conceptMakers: "/media/kingxford-production-system.webp",
  },
} as const;
