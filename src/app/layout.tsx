import type { Metadata } from "next";
import Script from "next/script";
import {
  Geist,
  Geist_Mono,
  Zen_Old_Mincho,
  Noto_Sans_JP,
  EB_Garamond,
  IBM_Plex_Mono,
  Shippori_Mincho_B1,
} from "next/font/google";
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
    default: "Human-OS｜人間の全てを可視化する診断プラットフォーム",
    template: "%s｜Human-OS",
  },
  description:
    "Human-OSは、複数の診断を通じて、人の特性や行動傾向を多面的に読み解く診断プラットフォームです。V1では、仕事における思考・行動・判断・役割傾向を扱う「ビジマル診断」を公開しています。",
  metadataBase: new URL("https://human-os.site"),
  openGraph: {
    siteName: "Human-OS",
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
      </body>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8046568622019006"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
    </html>
  );
}
