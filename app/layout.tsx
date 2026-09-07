import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
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

const siteUrl = "https://kingxford-agency-ca.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AVALON Creative Group — Ideas with vision. Work with impact.",
    template: "%s | AVALON Creative Group",
  },
  description:
    "Independent strategy, brand design, film, digital experiences and growth. Avalon Creative Group connects your brief, creative studios, campaign planning and results in one workspace.",
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
    title: "AVALON Creative Group — Ideas with vision. Work with impact.",
    description: "Strategy, design, production, digital and growth. One creative group. One connected workspace.",
    type: "website",
    locale: "en_CA",
    images: [{ url: "/images/hero-research-wall.webp", width: 1600, height: 900, alt: "The opening research wall in AVALON's cinematic agency film" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVALON Creative Group — Ideas with vision. Work with impact.",
    description: "Strategy, design, production, digital and growth. One creative group. One connected workspace.",
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
