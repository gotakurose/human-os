import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Zen_Old_Mincho,
  Noto_Sans_JP,
  EB_Garamond,
  IBM_Plex_Mono,
  Shippori_Mincho_B1,
} from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zenOldMincho = Zen_Old_Mincho({
  variable: "--font-zen-old-mincho",
  subsets: ["latin"],
  weight: ["400", "600"],
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

// Display / heading — for type names and major headings only
const shipporiMinchoB1 = Shippori_Mincho_B1({
  variable: "--font-shippori",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  preload: false,
});

// English serif — for englishName, Dossier labels, italicized quotes
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  preload: false,
});

// Document mono — for TYPE-01, No. 001, section IDs, axis values
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Human OS — 人間を可視化するAI診断プラットフォーム",
    template: "%s | Human OS",
  },
  description:
    "Human OS は100種類以上の診断を提供するAI診断プラットフォームです。固定タイプで結果を共有し、自分を深く知ることができます。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    siteName: "Human OS",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={[
        geistSans.variable,
        geistMono.variable,
        zenOldMincho.variable,
        notoSansJP.variable,
        ebGaramond.variable,
        ibmPlexMono.variable,
        shipporiMinchoB1.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
