import type { Metadata } from "next";
import Link from "next/link";
import styles from "./best-station.module.css";

export const metadata: Metadata = {
  title: "無理するな、お前が住むべき最寄り駅｜Human-OS",
  description:
    "30問で、東京80駅から「今のあなたに本当に合う最寄り駅」を診断。住所のブランドでも家賃の安さでもなく、あなたの生活実態と環境要件から導き出します。",
};

const BS = {
  ink: "#211920",
  muted: "#71656D",
  pink: "#FF4F9A",
  border: "#241C22",
};

export default function BestStationTopPage() {
  return (
    <main className={styles.root}>
      {/* Nav */}
      <div className="px-5 py-4">
        <Link href="/" className="text-sm font-jp" style={{ color: BS.muted }}>
          ← トップへ
        </Link>
      </div>

      {/* Hero */}
      <section className="px-5 pt-8 pb-12 max-w-lg mx-auto">
        <span className={`${styles.sticker} ${styles.stickerPink} mb-5`}>
          東京80駅・全部本気
        </span>

        <h1
          className={`${styles.display} ${styles.inkShadow} mt-5 mb-6`}
          style={{ fontSize: "clamp(28px, 8.5vw, 42px)", color: BS.ink }}
        >
          無理すんな、<br />
          お前が<span className={styles.markerYellow}>住むべき</span><br />
          最寄り駅
        </h1>

        <p
          className="font-jp leading-relaxed mb-8"
          style={{ fontSize: "15px", color: BS.ink }}
        >
          住所のブランドでも、家賃の安さでも、通勤の近さでもない。<br />
          あんたの生活実態・環境の相性・お金のリアルから、東京80駅の中で「今のあんたにガチで合う街」を当てにいくヨ。
        </p>

        {/* Info stickers */}
        <div className="flex flex-wrap gap-2.5 mb-9">
          <span className={`${styles.sticker} ${styles.stickerYellow}`}>30問</span>
          <span className={`${styles.sticker} ${styles.stickerAqua}`}>4〜6分</span>
          <span className={`${styles.sticker} ${styles.stickerCoral}`}>東京80駅</span>
        </div>

        <Link
          href="/diagnoses/best-station/questions"
          className={`${styles.cta} font-jp text-[16px] py-4`}
        >
          診断を始める →
        </Link>

        <p className="mt-4 text-xs font-jp text-center" style={{ color: BS.muted }}>
          入力内容はブラウザにのみ保存。サーバーには送信しません。
        </p>
      </section>

      {/* What you get */}
      <section className="px-5 py-10 max-w-lg mx-auto" style={{ borderTop: `2px solid ${BS.border}` }}>
        <div className="flex items-center gap-2 mb-6">
          <span className={`${styles.sticker} ${styles.stickerPink}`}>RESULT</span>
          <h2 className="font-jp font-bold text-[17px]" style={{ color: BS.ink }}>
            この診断でわかること
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {[
            {
              title: "住むべき最寄り駅（1つ）",
              body: "30問の回答を6層の観測モデルに通して、80駅の中から今いちばんフィットする駅を出すヨ。",
            },
            {
              title: "別候補（2つ）",
              body: "第1候補と近いけど、妥協ポイントが違う2駅。アクセス重視・広さ重視みたいに軸をずらして提示。",
            },
            {
              title: "惹かれやすいけど、無理が出やすい駅",
              body: "理想には刺さるのに、住むと地味にしんどい——そういう駅を、条件がそろえば1つだけ別で出すヨ。",
            },
            {
              title: "今の暮らしへのツッコミ",
              body: "使ってない便利さへの課金、通勤消耗、住所ブランド沼。今の『無理』を近い距離で指摘するヨ。",
            },
          ].map(({ title, body }) => (
            <div key={title} className={`${styles.readCard} p-5`}>
              <p className="font-jp font-bold text-[15px] mb-2" style={{ color: BS.ink }}>
                {title}
              </p>
              <p className="font-jp text-sm leading-relaxed" style={{ color: BS.muted }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer note */}
      <section className="px-5 pb-12 max-w-lg mx-auto">
        <Link
          href="/diagnoses/best-station/about"
          className="text-xs font-jp underline"
          style={{ color: BS.muted }}
        >
          注意事項・免責事項
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8" style={{ borderTop: `2px solid ${BS.border}` }}>
        <div className="max-w-lg mx-auto flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-xs font-mono" style={{ color: BS.muted }}>© 2026 Human-OS</p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/terms" className="text-xs font-jp hover:underline" style={{ color: BS.muted }}>利用規約</Link>
            <Link href="/privacy" className="text-xs font-jp hover:underline" style={{ color: BS.muted }}>プライバシーポリシー</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
