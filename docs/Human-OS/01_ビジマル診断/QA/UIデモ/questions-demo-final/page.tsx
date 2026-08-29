import type { Metadata } from "next";
import { QuestionFinalDemo } from "./QuestionFinalDemo";

export const metadata: Metadata = {
  title: "質問UI 最終確認サンプル",
  robots: { index: false, follow: false },
};

const Q_INDEX: Record<string, number> = { "1": 0, "14": 1, "24": 2 };

export default async function QuestionsDemoFinalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialIndex = q !== undefined ? (Q_INDEX[q] ?? 2) : 2;
  return <QuestionFinalDemo initialIndex={initialIndex} />;
}
