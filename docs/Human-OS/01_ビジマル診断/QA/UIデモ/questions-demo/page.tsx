import type { Metadata } from "next";
import { DemoContent } from "./DemoContent";

export const metadata: Metadata = {
  title: "質問UI デモ",
  robots: { index: false, follow: false },
};

export default function QuestionsDemoPage() {
  return <DemoContent />;
}
