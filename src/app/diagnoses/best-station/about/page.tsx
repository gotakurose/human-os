import type { Metadata } from "next";
import Link from "next/link";
import styles from "../best-station.module.css";

export const metadata: Metadata = {
  title: "注意事項 — 無理するな、お前が住むべき最寄り駅",
  description: "「無理するな、お前が住むべき最寄り駅」診断の注意事項・免責事項ページ。",
};

const BS = {
  ink: "#211920",
  muted: "#71656D",
  pink: "#FF4F9A",
};

const SECTIONS: { h: string; body: string }[] = [
  {
    h: "診断の目的と限界",
    body:
      "本診断は「今のあなたの生活実態と環境要件に基づいて、参考となる最寄り駅を提案する」ことを目的としています。提案される駅は統計的な最適解ではなく、あなたの回答から算出されるモデル上の推薦です。生活傾向を扱うエンタメ診断であり、不動産仲介・投資助言・住宅ローン審査・物件推薦ではありません。",
  },
  {
    h: "駅データについて",
    body:
      "掲載している80駅のデータ（便益・負荷・家賃ティア等）は編集的な暫定値であり、実際の相場・個別物件・生活環境を保証するものではありません。家賃、交通、治安、災害、学校、医療、再開発等の最新状況も保証しません。データはUI・ロジック検証用の初期値として設定されており、公開前に横断監査を予定しています。",
  },
  {
    h: "個人情報・プライバシー",
    body:
      "診断中に入力された収入・住居費・居住地等の情報は、ブラウザのセッションストレージにのみ保存されます。サーバーへの送信、外部サービスへの連携、ログへの記録は一切行いません。ブラウザを閉じる、またはタブを閉じると自動的に削除されます。",
  },
  {
    h: "住居選択に関する免責",
    body:
      "本診断は結果駅への転居を推奨・保証しません。結果を参考に住居を選択した場合でも、Human-OSは一切の責任を負いません。実際の住居選択は、最新情報の確認・現地確認・不動産専門家への相談等を経て、本人の責任において行ってください。",
  },
  {
    h: "表現と敬意について",
    body:
      "結果には演出的に鋭い表現を含みます。ただし本診断は、所得・支援・現在の居住地域で人の価値を評価するものではなく、都会・田舎・駅・住民を優劣で序列化するものでもありません。問題は場所そのものではなく、あなたと環境との相性として扱います。",
  },
  {
    h: "診断の対象エリア",
    body:
      "本診断は東京都内および近郊の約80駅を対象としています。対象エリア外にお住まいの方も診断を受けることはできますが、結果は東京圏への移住・転居を前提とした提案となります。",
  },
];

export default function BestStationAboutPage() {
  return (
    <main className={styles.root}>
      <div className="px-5 py-4">
        <Link href="/diagnoses/best-station" className="text-sm font-jp" style={{ color: BS.muted }}>
          ← 診断トップへ
        </Link>
      </div>

      <div className="px-5 py-8 max-w-lg mx-auto">
        <span className={`${styles.sticker} ${styles.stickerYellow} mb-4`}>ABOUT</span>
        <h1
          className={`${styles.display} mt-4 mb-8`}
          style={{ fontSize: "clamp(22px, 5.5vw, 28px)", color: BS.ink }}
        >
          注意事項・免責事項
        </h1>

        <div className="flex flex-col gap-5 font-jp text-sm leading-relaxed" style={{ color: BS.muted }}>
          {SECTIONS.map(({ h, body }) => (
            <section key={h} className={`${styles.readCard} p-5`}>
              <h2 className="font-bold text-base mb-2" style={{ color: BS.ink }}>{h}</h2>
              <p>{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/diagnoses/best-station" className={`${styles.cta} py-3.5 text-sm`}>
            診断トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
