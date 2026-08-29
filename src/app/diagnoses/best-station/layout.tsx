import { Dela_Gothic_One } from "next/font/google";

const delaGothic = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});

export default function BestStationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={delaGothic.variable}
      style={
        {
          "--bs-bg": "#FFF8F1",
          "--bs-surface": "#FFFFFF",
          "--bs-ink": "#211920",
          "--bs-muted": "#71656D",
          "--bs-pink": "#FF4F9A",
          "--bs-coral": "#FF765B",
          "--bs-yellow": "#FFD84D",
          "--bs-aqua": "#52D8D2",
          "--bs-lavender": "#B9A5FF",
          "--bs-border": "#241C22",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
