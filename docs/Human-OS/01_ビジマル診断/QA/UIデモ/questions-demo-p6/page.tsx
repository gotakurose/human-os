import type { Metadata } from "next";
import { QuestionP6Demo } from "./QuestionP6Demo";

export const metadata: Metadata = {
  title: "質問UI Pattern6デモ",
  robots: { index: false, follow: false },
};

const Q_INDEX: Record<string, number> = { "1": 0, "14": 1, "24": 2 };

export default async function QuestionsDemoP6Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialIndex = q !== undefined ? (Q_INDEX[q] ?? 2) : 2;
  return <QuestionP6Demo initialIndex={initialIndex} />;
}
