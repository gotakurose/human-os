import type { Metadata } from "next";
import { QuestionP5Demo } from "./QuestionP5Demo";

export const metadata: Metadata = {
  title: "質問UI Pattern5デモ",
  robots: { index: false, follow: false },
};

const Q_INDEX: Record<string, number> = { "1": 0, "14": 1, "24": 2 };

export default async function QuestionsDemoP5Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialIndex = q !== undefined ? (Q_INDEX[q] ?? 2) : 2;
  return <QuestionP5Demo initialIndex={initialIndex} />;
}
