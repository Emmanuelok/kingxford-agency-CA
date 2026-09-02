import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kingxford-agency.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: {
    default: "KINGXFORD — Integrated Advertising Agency in St. John's",
    template: "%s | KINGXFORD Agency",
  },
  description:
    "KINGXFORD brings strategy, identity, campaigns, film, social, media and digital into one accountable advertising agency—from St. John's to markets across Canada.",
  keywords: [
    "advertising agency St. John's",
    "marketing agency Newfoundland",
    "Canadian creative agency",
    "social media agency",
    "web development agency",
    "commercial production",
    "media buying Canada",
  ],
  openGraph: {
    title: "KINGXFORD — Move the thing that matters.",
    description: "Strategy, identity, campaigns, production, media and digital. Six rooms, one brief, one accountable agency.",
    type: "website",
    locale: "en_CA",
    images: [{ url: "/images/hero-research-wall.webp", width: 1600, height: 900, alt: "The opening research wall in KINGXFORD's cinematic agency film" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KINGXFORD — Move the thing that matters.",
    description: "Strategy, identity, campaigns, production, media and digital. Six rooms, one accountable agency.",
    images: ["/images/hero-research-wall.webp"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
