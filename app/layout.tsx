import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/manrope/wght.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "KINGXFORD — Creative and Growth Agency in St. John’s",
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    title: "KINGXFORD — Make the market feel you.",
    description: SITE.description,
    type: "website",
    locale: "en_CA",
    siteName: SITE.name,
    images: [{ url: SITE.cinematicPosterUrl, width: 1920, height: 1080 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KINGXFORD — Make the market feel you.",
    description: SITE.description,
    images: [SITE.cinematicPosterUrl],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#080a0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-CA">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
