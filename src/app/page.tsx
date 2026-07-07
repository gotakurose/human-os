import Link from "next/link";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-5 pt-16 pb-12 md:pt-24 md:pb-16 max-w-2xl mx-auto">
        <p className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-4">
          Human OS
        </p>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-neutral-900 mb-4">
          人間を可視化する
          <br />
          AI診断プラットフォーム
        </h1>
        <p className="text-base text-neutral-500 leading-relaxed">
          あなたの能力・性格・思考スタイルを診断し、
          <br className="hidden sm:block" />
          固定タイプで可視化します。
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100 mx-5 max-w-2xl md:mx-auto" />

      {/* Diagnosis list */}
      <section className="px-5 pt-10 pb-20 max-w-2xl mx-auto">
        <h2 className="text-xs font-mono tracking-widest text-neutral-400 uppercase mb-6">
          Diagnoses
        </h2>

        <div className="flex flex-col gap-4">
          <DiagnosisCard
            title="社会人能力値診断"
            description="40問で16タイプと4つのスタイル傾向を分析。あなたの社会人タイプを判定します。"
            category="キャリア"
            estimatedMinutes={8}
            status="available"
            href="/diagnoses/business-skills"
          />
        </div>

        <p className="mt-10 text-xs text-neutral-300 text-center tracking-wide">
          診断は順次追加予定です
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 px-5 py-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-neutral-400 font-mono">© 2026 Human OS</p>
          <nav className="flex gap-5">
            <Link
              href="/privacy"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/disclaimer"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              免責事項
            </Link>
            <Link
              href="/contact"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              お問い合わせ
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
