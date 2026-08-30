import { loadTypes, loadFixedCopy } from "@/lib/data-loader";
import { TYPE_DISPLAY_ASSETS } from "@/app/diagnoses/[diagnosisId]/results/[typeId]/result-assets";
import Link from "next/link";

export const metadata = {
  title: "ビジマル16タイプ図鑑",
  description:
    "ビジマル診断に登場する、16種類のビジネスアニマルの一覧。各タイプのキャラクター、動物タイプ、一言説明を確認できます。",
};

export default function TypesPage() {
  const types = loadTypes("business-skills");
  const fixedCopy = loadFixedCopy("business-skills");

  const typeList = types.map((t) => {
    const assets = TYPE_DISPLAY_ASSETS[t.id] ?? null;
    const fc = fixedCopy.types.find((f) => f.typeId === t.id);
    return { ...t, assets, catchText: fc?.catch.text ?? "" };
  });

  return (
    <main className="dossier-page flex-1" style={{ color: "#21160D", minHeight: "100vh" }}>
      <div className="max-w-[1040px] mx-auto px-5 md:px-7 lg:px-8 pt-12 pb-20">

        {/* Header */}
        <div className="mb-4 text-left">
          <Link
            href="/diagnoses/business-skills"
            className="text-xs md:text-sm font-jp transition-opacity hover:opacity-70"
            style={{ color: "rgba(33,22,13,0.52)" }}
          >
            ← ビジマル診断
          </Link>
        </div>

        <header className="mb-10 md:mb-14">
          <h1
            className="font-heading tracking-[0.04em]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", lineHeight: "1.2", color: "#17100A" }}
          >
            ビジマル16タイプ図鑑
          </h1>
          <p
            className="font-jp text-sm mt-3"
            style={{ color: "rgba(33,22,13,0.58)" }}
          >
            ビジマル診断に登場する、16種類のビジネスアニマル。
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {typeList.map((t) => (
            <Link
              key={t.id}
              href={`/diagnoses/business-skills/types/${t.id}`}
              className="flex flex-col group transition-opacity hover:opacity-80"
            >
              {/* Character image */}
              <div
                className="mb-3"
                style={{ background: "rgba(244,240,231,0.55)", borderRadius: "6px", overflow: "hidden" }}
              >
                {t.assets?.characterImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.assets.characterImage}
                    alt={t.name}
                    className="w-full h-auto object-contain block"
                  />
                ) : (
                  <div
                    className="w-full aspect-[3/4] flex items-end justify-start p-3"
                    style={{ background: "rgba(244,240,231,0.80)" }}
                  >
                    <span
                      className="text-[9px] font-mono-doc tracking-[0.2em]"
                      style={{ color: "rgba(111,85,44,0.40)" }}
                    >
                      PORTRAIT
                    </span>
                  </div>
                )}
              </div>

              {/* Animal type */}
              {t.assets?.animalType && (
                <p
                  className="font-mono-doc mb-1"
                  style={{ fontSize: "10px", letterSpacing: "0.12em", color: "rgba(111,85,44,0.80)" }}
                >
                  {t.assets.animalType}
                </p>
              )}

              {/* Japanese type name */}
              <p
                className="font-heading tracking-[0.03em] mb-2"
                style={{ fontSize: "clamp(14px, 2.8vw, 17px)", lineHeight: "1.3", color: "#17100A" }}
              >
                {t.name}
              </p>

              {/* One-line catch text */}
              {t.catchText && (
                <p
                  className="font-jp leading-[1.7]"
                  style={{ fontSize: "11px", color: "rgba(33,22,13,0.64)" }}
                >
                  {t.catchText}
                </p>
              )}
            </Link>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer
        className="px-6 md:px-10 py-10"
        style={{ borderTop: "1px solid rgba(111,85,44,0.20)" }}
      >
        <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row justify-between items-start gap-4">
          <p className="font-mono-doc text-xs" style={{ color: "rgba(33,22,13,0.38)" }}>
            © 2026 Human-OS
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link
              href="/terms"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.60)" }}
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.60)" }}
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/diagnoses/business-skills/types"
              className="font-jp text-xs hover:underline"
              style={{ color: "rgba(33,22,13,0.60)" }}
            >
              ビジマル16タイプ図鑑
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
