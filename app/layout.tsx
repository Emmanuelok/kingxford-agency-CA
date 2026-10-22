import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./avalon.css";
import "./workspace.css";
import "./performance.css";
import "./brand.css";

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
    siteName: "Avalon Creatives Group",
    images: [{ url: "/brand/avalon-og-2026.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Avalon Creatives Group — Ideas with vision. Work with impact. Sculptural coral AV monogram on charcoal." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVALON Creatives Group — Ideas with vision. Work with impact.",
    description: "A global creative platform connecting strategy, design, production, digital and growth across Canada, US, UK, Hong Kong and Ghana.",
    images: ["/brand/avalon-og-2026.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=20261022", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.svg?v=20261022",
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
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
          logo: { "@type": "ImageObject", url: `${siteUrl}/brand/avalon-logo-dark.png`, width: 2120, height: 480 },
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
