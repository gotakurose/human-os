# Human OS

仕事における思考・行動・判断・役割傾向を多面的に診断するプラットフォームです。

本番：https://human-os.site

## V1 公開状態

- **ビジマル診断**（`/diagnoses/business-skills`）— 公開中
  - 40問・16タイプ・4軸・5能力値・族バッジ・特化個体バッジ
  - 固定文章 v7-final、4軸動的文章 v3-final

## ディレクトリ構成

```
Human-OS/
├── docs/specs/     # 正本仕様書（共通 + 診断固有）
├── data/           # 診断データ（質問・採点・文章 JSON）
├── public/         # 静的アセット（画像・アイコンなど）
├── src/            # Next.js App Router ソースコード
└── scripts/        # 開発用スクリプト（シミュレーション等）
```

## 仕様書

`docs/specs/README.md` を参照。
