"use client";

import { useState, useEffect } from "react";

interface Props {
  typeName: string;
}

export function ResultShareSection({ typeName }: Props) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // window.location is browser-only; useEffect is the correct SSR-safe pattern here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUrl(window.location.href);
  }, []);

  const shareText   = encodeURIComponent(`私は「${typeName}」でした。 #ビジマル診断 #HumanOS`);
  const encodedUrl  = encodeURIComponent(currentUrl);
  const xUrl        = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const lineUrl     = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail, UI stays intact
    }
  }

  return (
    <div
      className="mx-auto px-5 md:px-0"
      style={{ maxWidth: "760px" }}
    >
      {/* ── シェアカード */}
      <div
        style={{
          border: "1px solid rgba(111,85,44,0.26)",
          background: "rgba(248,243,230,0.50)",
          padding: "24px 18px",
        }}
      >
        <h2
          className="font-heading leading-[1.1] tracking-[0.04em] mb-2 share-title"
          style={{ color: "#17100A" }}
        >
          結果をシェア
        </h2>
        <p
          className="font-mono-doc sub-label mb-8"
          style={{ letterSpacing: "0.24em", color: "rgba(111,85,44,0.72)" }}
        >
          SHARE YOUR RESULT
        </p>

        {/* ── シェアボタン ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* X */}
          <a
            href={currentUrl ? xUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!currentUrl}
            className="flex items-center justify-center gap-2 h-14 md:h-[60px]
                       text-sm md:text-base font-semibold font-jp
                       transition-opacity hover:opacity-80"
            style={{ background: "#11100D", color: "#F4EFE4" }}
          >
            𝕏 でシェア
          </a>

          {/* LINE */}
          <a
            href={currentUrl ? lineUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!currentUrl}
            className="flex items-center justify-center gap-2 h-14 md:h-[60px]
                       text-sm md:text-base font-semibold font-jp
                       transition-opacity hover:opacity-80"
            style={{ background: "#06C755", color: "white" }}
          >
            LINE でシェア
          </a>

          {/* URL コピー */}
          <button
            onClick={handleCopy}
            disabled={!currentUrl}
            className="flex items-center justify-center gap-2 h-14 md:h-[60px]
                       text-sm md:text-base font-semibold font-jp
                       transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "#5A4A2A", color: "white" }}
          >
            {copied ? "コピーしました ✓" : "URL コピー"}
          </button>
        </div>

        {/* ── URL 表示欄 — min-width: 0 で横幅オーバーを防ぐ */}
        <input
          type="text"
          readOnly
          value={currentUrl}
          placeholder="URL を読み込み中..."
          className="mt-4 w-full h-11 font-mono-doc text-xs md:text-sm px-4 min-w-0"
          style={{
            background: "rgba(255,250,240,0.50)",
            border: "1px solid rgba(111,85,44,0.24)",
            color: "#21160D",
            outline: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
      </div>
    </div>
  );
}
