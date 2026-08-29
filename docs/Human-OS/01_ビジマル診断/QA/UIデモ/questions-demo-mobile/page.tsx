import type { Metadata } from "next";
import { QuestionDemoCard } from "../questions-demo/_components/QuestionDemoCard";

export const metadata: Metadata = {
  title: "質問UI デモ（iPhone）",
  robots: { index: false, follow: false },
};

export default function QuestionsDemoMobilePage() {
  return <QuestionDemoCard layout="mobile" />;
}
