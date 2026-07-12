import Link from "next/link";
import { DiagnosisCard } from "@/components/diagnosis/DiagnosisCard";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="px-5 pt-14 pb-10 md:pt-20 md:pb-14 max-w-2xl mx-auto">
        {/* Brand name */}
        <p
          className="font-serif-en"
          style={{
            fontSize: "clamp(48px, 11vw, 76px)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "0.01em",
            color: "#0a0a0a",
            marginBottom: "clamp(28px, 3.5vw, 36px)",
          }}
        >
          Human-OS
        </p>

        {/* H1 */}
        <h1
          className="font-bold tracking-tight text-neutral-900 mb-6"
          style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1.4 }}
        >
          人間の全てを可視化する
          <br className="hidden sm:block" />
          診断プラットフォーム
        </h1>

        {/* Description */}
        <div
          className="font-jp space-y-4"
          style={{
            fontSize: "clamp(15px, 1.7vw, 17px)",
            lineHeight: 1.85,
            color: "#606060",
          }}
        >
          <p>
            これは、ただの診断サイトではありません。さまざまな診断を重ね、あなたという人間の「設計図」をつくる場所です。
          </p>
          <p>
            能力・性格・思考・価値観を、さまざまな角度から多面的に可視化。将来的には、各診断の結果をAIが横断して分析・統合し、あなたという人間を立体的に読み解きます。
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100 mx-5 max-w-2xl md:mx-auto" />

      {/* Diagnosis list */}
      <section className="px-5 pt-10 pb-16 max-w-2xl mx-auto">
        <h2 className="text-xs font-jp text-neutral-400 mb-6">診断</h2>

        <div className="flex flex-col gap-4">
          <DiagnosisCard
            title="ビジマル診断"
            description="40問で、16タイプ・5つの能力値・4つのスタイル軸を分析。タイプだけでなく、各指標の高低や組み合わせまで踏まえ、280万通り以上の中から、あなたの仕事タイプを多面的に診断します。"
            category="キャリア"
            estimatedMinutes={8}
            status="available"
            href="/diagnoses/business-skills"
            bgImage="/images/diagnoses/business-skills/top-card-bg.png"
          />
          {/* best-station: 実装済みだが現在非公開。再公開時にここのコメントを外す */}
        </div>

        <p className="mt-10 text-xs text-neutral-300 text-center tracking-wide font-jp">
          さらに多くの診断がCOMING SOON…
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 px-5 py-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-neutral-400 font-mono">© 2026 Human-OS</p>
          <nav className="flex flex-wrap gap-5">
            <Link
              href="/terms"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/diagnoses/business-skills/types"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              ビジマル16タイプ図鑑
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
