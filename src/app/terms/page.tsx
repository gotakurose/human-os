import Link from "next/link";

export const metadata = {
  title: "利用規約",
  description: "Human-OSおよびビジマル診断の利用規約。本サービスを利用する前にお読みください。",
};

const CHAPTERS = [
  {
    num: "第1条",
    title: "適用",
    body: [
      "この利用規約（以下「本規約」といいます。）は、Human-OS（以下「本サービス」といいます。）を利用するすべての方（以下「利用者」といいます。）に適用されます。",
      "本サービスを利用した場合、本規約に同意したものとみなします。",
    ],
  },
  {
    num: "第2条",
    title: "本サービスの内容",
    body: [
      "本サービスは、ビジマル診断など複数の診断を通じて、人の特性や行動傾向を多面的に読み解く診断プラットフォームです。",
      "V1で利用できる診断はビジマル診断のみです。複数診断の統合表示やAIによる横断分析は、今後の拡張予定です。",
    ],
  },
  {
    num: "第3条",
    title: "診断結果の性質",
    body: [
      "本サービスが提供する診断結果は、回答時点で利用者が選んだ仕事上の行動を一定のルールで整理した参考情報です。",
      "診断結果は、実技能試験、IQ検査、学力検査、採用適性検査、人事評価、医療・心理診断、疾患や障害の診断、人格の優劣判定、職業適性や将来の成果の断定を目的とするものではありません。",
      "診断結果の完全性、正確性、特定目的への適合性を保証するものではありません。",
    ],
  },
  {
    num: "第4条",
    title: "利用上の注意",
    body: [
      "診断結果だけを根拠として、採用、不採用、配置、昇進、契約、治療、退職、転職その他の重要な判断を行わないでください。",
      "診断結果に違和感がある場合は、無理に受け入れる必要はありません。",
    ],
  },
  {
    num: "第5条",
    title: "結果URLの取扱い",
    body: [
      "診断完了後、結果の再表示に必要な情報（診断タイプ、4軸スコア、5能力値の算出に用いる内部スコア）を含むURLが生成されます。",
      "結果URLを保存すれば、ブラウザを閉じた後でも同じ結果を再表示できます。結果URLを第三者へ送信または公開した場合、そのURLを知る第三者も結果を閲覧できます。公開を望まない場合は、結果URLを共有しないでください。",
    ],
  },
  {
    num: "第6条",
    title: "禁止事項",
    body: [
      "利用者は、以下の行為を行ってはなりません。",
      "（1）本サービスへの不正アクセスまたはそれを試みる行為",
      "（2）本サービスの運営を妨害する行為",
      "（3）本サービスのリバースエンジニアリング、逆コンパイル、逆アセンブル",
      "（4）本サービスを利用した商業目的の無断利用",
      "（5）法令または公序良俗に違反する行為",
      "（6）その他、本サービスの運営者が不適切と判断する行為",
    ],
  },
  {
    num: "第7条",
    title: "外部サービス",
    body: [
      "本サービスは、XおよびLINEへの結果共有機能を提供します。共有ボタンを押した場合に限り、各サービスの共有URLを開きます。",
      "本サービスは、これらの外部サービスの埋め込みSDKや常駐スクリプトを使用しません。外部サービスの利用については、各サービスの利用規約およびプライバシーポリシーが適用されます。",
    ],
  },
  {
    num: "第8条",
    title: "サービスの変更・停止",
    body: [
      "本サービスの運営者は、利用者への事前通知なく、本サービスの内容を変更または提供を停止することがあります。",
      "本サービスの変更・停止によって利用者に生じた損害について、運営者は責任を負いません。ただし、法令により責任を免除できない場合を除きます。",
    ],
  },
  {
    num: "第9条",
    title: "免責",
    body: [
      "本サービスの運営者は、本サービスまたは診断結果を参考に利用者が行った判断や行動について、責任を負いません。ただし、法令により責任を免除できない場合を除きます。",
      "本サービスの運営者は、本サービスに関して利用者と第三者との間に生じた紛争について、責任を負いません。",
    ],
  },
  {
    num: "第10条",
    title: "規約の変更",
    body: [
      "本サービスの運営者は、必要と判断した場合、本規約を変更することがあります。",
      "変更後の規約は、本サービス上に掲載した時点から効力を生じます。重要な変更がある場合は、本サービス上で分かりやすく告知します。",
    ],
  },
  {
    num: "第11条",
    title: "運営表示",
    body: ["本サービスの運営表示名は「Human-OS」です。"],
  },
];

const DL = "1px solid rgba(33,22,13,0.10)";

export default function TermsPage() {
  return (
    <main style={{ background: "#FDFCF9", color: "#21160D", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-20">

        {/* Back */}
        <Link
          href="/"
          className="text-xs font-jp inline-block mb-10 transition-opacity hover:opacity-60"
          style={{ color: "rgba(33,22,13,0.48)" }}
        >
          ← Human-OS
        </Link>

        {/* Header */}
        <header className="mb-10" style={{ borderBottom: DL, paddingBottom: "1.5rem" }}>
          <p
            className="font-mono-doc text-[10px] tracking-[0.18em] mb-3"
            style={{ color: "rgba(111,85,44,0.72)" }}
          >
            TERMS OF SERVICE
          </p>
          <h1
            className="font-heading tracking-[0.04em] mb-3"
            style={{ fontSize: "clamp(1.75rem, 5vw, 2.25rem)", lineHeight: "1.2", color: "#17100A" }}
          >
            利用規約
          </h1>
          <p className="font-jp text-sm" style={{ color: "rgba(33,22,13,0.52)" }}>
            施行日：2026年7月8日
          </p>
        </header>

        {/* Chapters */}
        <div className="space-y-10">
          {CHAPTERS.map(({ num, title, body }) => (
            <section key={num}>
              <h2
                className="font-jp font-semibold mb-4"
                style={{ fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "#17100A" }}
              >
                {num}　{title}
              </h2>
              <div className="space-y-3">
                {body.map((paragraph, i) => (
                  <p
                    key={i}
                    className="font-jp leading-[1.85] text-sm md:text-base"
                    style={{ color: "rgba(33,22,13,0.78)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer
        className="px-5 py-8"
        style={{ borderTop: DL }}
      >
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.38)" }}>
            © 2026 Human-OS
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link
              href="/terms"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.52)" }}
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.52)" }}
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/diagnoses/business-skills/types"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.52)" }}
            >
              ビジマル16タイプ図鑑
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
