import type { Metadata } from "next";
import { loadResultCopy } from "@/lib/diagnoses/best-station/data";
import { ResultDisplay } from "@/components/diagnoses/best-station/ResultDisplay";

export const metadata: Metadata = {
  title: "診断結果 — 無理するな、お前が住むべき最寄り駅",
  robots: { index: false, follow: false },
};

export default function BestStationResultsPage() {
  const copyJson = loadResultCopy();
  return <ResultDisplay copyJson={copyJson} />;
}
