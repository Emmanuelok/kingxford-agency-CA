import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./avalon.css";
import "./workspace.css";
import "./performance.css";

const geistSans = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-kx-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-kx-mono",
  display: "swap",
  weight: "100 900",
});

const siteUrl = "https://avaloncreative.group";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVALON Creatives Group — Ideas with vision. Work with impact.",
    template: "%s | AVALON Creatives Group",
  },
  description:
    "Independent strategy, brand design, film, digital experiences and growth. Avalon Creatives Group is a global creative platform with a presence across Canada, US, UK, Hong Kong and Ghana.",
  keywords: [
    "global creative platform",
    "creative services Canada",
    "creative services US",
    "creative services UK",
    "creative services Hong Kong",
    "creative services Ghana",
    "social media agency",
    "web development agency",
    "commercial production",
    "media buying Canada",
  ],
  openGraph: {
    title: "AVALON Creatives Group — Ideas with vision. Work with impact.",
    description: "A global creative platform connecting strategy, design, production, digital and growth across Canada, US, UK, Hong Kong and Ghana.",
    type: "website",
    locale: "en_CA",
    images: [{ url: "/images/hero-research-wall.webp", width: 1600, height: 900, alt: "The opening research wall in AVALON's cinematic agency film" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVALON Creatives Group — Ideas with vision. Work with impact.",
    description: "A global creative platform connecting strategy, design, production, digital and growth across Canada, US, UK, Hong Kong and Ghana.",
    images: ["/images/hero-research-wall.webp"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${siteUrl}/#organization`,
          name: "Avalon Creatives Group",
          url: siteUrl,
          description: "A global creative platform for strategy, brand design, film, digital experiences and growth.",
          email: "avalon@veridanth.com",
          telephone: "+1-587-837-4472",
          areaServed: [
            { "@type": "Country", name: "Canada" },
            { "@type": "Country", name: "US", alternateName: "United States" },
            { "@type": "Country", name: "UK", alternateName: "United Kingdom" },
            { "@type": "Place", name: "Hong Kong" },
            { "@type": "Country", name: "Ghana" },
          ],
        }).replace(/</g, "\u003c") }} />
        {children}
      </body>
    </html>
  );
}
