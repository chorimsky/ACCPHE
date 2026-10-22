import type { Metadata, Viewport } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { INDEXABLE, ORG, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "ACCPHE",
  title: { default: `ACCPHE — ${ORG.name}`, template: "%s | ACCPHE" },
  description: ORG.description,
  keywords: ORG.keywords,
  authors: [{ name: "ACCPHE", url: SITE_URL }],
  creator: "ACCPHE",
  publisher: "ACCPHE",
  formatDetection: { telephone: false, email: false, address: false },
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { types: { "application/rss+xml": [{ url: "/news/rss.xml", title: "ACCPHE — News & Insights" }] } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = { themeColor: "#142B45", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body id="top">{children}</body>
    </html>
  );
}
