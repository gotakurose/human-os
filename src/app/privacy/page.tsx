import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー",
  description:
    "Human-OSおよびビジマル診断における、診断回答、診断結果URL、アクセスログ、Cookie、外部共有サービスの取扱いを説明します。",
};

const SECTIONS = [
  {
    id: "basic",
    title: "基本方針",
    body: [
      "Human-OSおよびビジマル診断（以下「本サイト」といいます。）は、本サイトの提供と安全な運営に必要な範囲で、利用者に関する情報を取り扱います。",
      "本サイトは、診断回答や診断結果を利用者ごとの診断履歴として保存せず、V1ではアクセス解析、広告配信、アフィリエイト計測、問い合わせフォームを使用しません。",
    ],
  },
  {
    id: "diagnosis",
    title: "診断回答と診断結果",
    body: [
      "40問への個別回答は、診断中のブラウザ画面内で処理されます。本サイトは、個々の回答内容を診断履歴としてサーバーまたはデータベースへ保存しません。",
      "診断結果も、利用者ごとの履歴としてサーバーまたはデータベースへ保存しません。localStorageおよびsessionStorageも使用しません。",
      "診断完了後は、結果の再表示に必要な情報を結果ページのURLへ含めます。結果URLには、診断タイプ、4軸スコア、5能力値の算出に用いる内部スコアが含まれます。",
      "結果URLを保存すれば、ブラウザを閉じた後でも同じ結果を再表示できます。結果URLを第三者へ送信または公開した場合、そのURLを知る第三者も結果を閲覧できます。公開を望まない場合は、結果URLを共有しないでください。",
      "結果ページには検索エンジンへの登録を抑制する設定を行いますが、この設定は閲覧制限や秘密保持を保証するものではありません。",
    ],
  },
  {
    id: "logs",
    title: "アクセス時に記録される可能性がある情報",
    body: [
      "本サイトの配信、安全管理、障害対応に伴い、ホスティング事業者のサーバーまたはログへ、IPアドレス、ブラウザや端末に関する情報、アクセス日時、アクセス先URL、クエリ文字列、HTTPステータス、User-Agent等が記録される場合があります。",
      "結果ページへアクセスした場合、アクセス先URLやクエリ文字列の一部として、結果の再表示に必要な情報がログへ含まれる場合があります。",
      "これらの情報は、サイト配信、セキュリティ確保、障害調査、不正利用防止のために取り扱い、診断結果の個人別プロフィール作成、広告配信、営業活動には使用しません。",
    ],
  },
  {
    id: "cookies",
    title: "Cookie・アクセス解析・広告",
    body: [
      "V1の本サイトは、独自のCookieを利用したログイン、診断履歴保存、アクセス解析、広告配信、アフィリエイト計測を行いません。",
      "Google Analytics 4、Vercel Analytics、Vercel Speed Insights、広告配信タグ、アフィリエイト計測タグは使用しません。",
      "将来これらの機能を追加する場合は、公開前に本ポリシーを改定し、必要に応じて利用者への告知または同意取得を行います。",
    ],
  },
  {
    id: "external-share",
    title: "外部サービスへの共有",
    body: [
      "結果ページには、XおよびLINEへの共有ボタンを設置します。",
      "本サイトは、これらのサービスの埋め込みSDKや常駐スクリプトを読み込みません。利用者が共有ボタンを押した場合に限り、共有先サービスのページを開きます。",
      "共有ボタンを押した後に共有先サービスが取得する情報は、各サービスの利用規約およびプライバシーポリシーに従って取り扱われます。",
    ],
  },
  {
    id: "third-party",
    title: "第三者提供",
    body: [
      "本サイトは、法令に基づく場合を除き、本サイトが保有する個人情報を本人の同意なく第三者へ提供しません。",
      "V1では、診断回答と診断結果を個人別の診断履歴として保有しません。",
    ],
  },
  {
    id: "security",
    title: "安全管理",
    body: [
      "本サイトは、通信の暗号化、不要な外部送信の抑制、診断データの非保存、アクセス権限の管理等、取り扱う情報の内容に応じた安全管理に努めます。",
      "結果URLには診断情報が含まれるため、利用者自身も、公開範囲を確認したうえで共有してください。",
    ],
  },
  {
    id: "change",
    title: "ポリシーの変更",
    body: [
      "本サイトの機能、利用する外部サービス、法令その他の事情が変わった場合、本ポリシーを変更することがあります。",
      "重要な変更がある場合は、本サイト上で分かりやすく告知します。",
    ],
  },
  {
    id: "operator",
    title: "運営表示",
    body: ["本サイトの運営表示名は「Human-OS」です。"],
  },
];

const DL = "1px solid rgba(33,22,13,0.10)";

export default function PrivacyPage() {
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
            PRIVACY POLICY
          </p>
          <h1
            className="font-heading tracking-[0.04em] mb-3"
            style={{ fontSize: "clamp(1.75rem, 5vw, 2.25rem)", lineHeight: "1.2", color: "#17100A" }}
          >
            プライバシーポリシー
          </h1>
          <p className="font-jp text-sm" style={{ color: "rgba(33,22,13,0.52)" }}>
            施行日：2026年7月8日
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ id, title, body }) => (
            <section key={id} id={id}>
              <h2
                className="font-jp font-semibold mb-4"
                style={{ fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)", color: "#17100A" }}
              >
                {title}
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
