# ARCHITECTURE.md — システム設計方針

## 設計の根本思想

> **診断はコードではなくデータ。診断エンジンは1つ。新しい診断はJSON追加だけで実装できる。**

- `src/engine/` は一度作れば変更しない
- `data/diagnoses/` にフォルダとJSONを追加するだけで診断が増える
- 100本以上の診断追加に耐えるスキーマ設計とデータ検証を最初から組み込む

---

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|---|---|---|
| フレームワーク | Next.js 14（App Router） | SSG/SSR両対応、OGP生成、Vercel最適化 |
| スタイリング | Tailwind CSS | ユーティリティファースト、一貫したUI管理 |
| UIコンポーネント | shadcn/ui | Radix UI ベース、カスタマイズ性が高い |
| ホスティング | Vercel | Next.js との親和性、CDN、Preview Deploy |
| データ管理（初期） | JSON ファイル | DB不要で診断追加が最速、git管理可能 |
| データ管理（拡張時） | Supabase | ユーザー認証・履歴保存が必要になった段階で導入 |
| スキーマ検証 | Zod | JSON データの型安全・破損検出 |
| グラフ描画 | Recharts または Chart.js | レーダーチャート表示 |
| OGP画像生成 | @vercel/og | タイプ別固定OGPの生成 |

---

## フォルダ構成

```
Human-OS/
├── docs/                            # 設計ドキュメント（このフォルダ）
├── data/                            # 診断データ（JSONファイル群）
│   ├── diagnoses/                   # 診断ごとのJSONデータ
│   │   ├── business-skills/         # 社会人能力値診断
│   │   │   ├── meta.json            # 診断メタ情報（タイトル・説明・タグ）
│   │   │   ├── questions.json       # 質問リスト
│   │   │   ├── types.json           # タイプ定義（スコア・説明・コメント）
│   │   │   └── scoring.json         # スコアリングロジック定義
│   │   ├── house-check/             # 家買いたい？チェッカー
│   │   └── personality-16/          # オリジナル16タイプ診断
│   └── index.json                   # 全診断の一覧（初期：手動管理）
├── public/
│   ├── images/
│   │   ├── characters/              # タイプ別キャラクター画像
│   │   └── og/                      # OGPベース画像テンプレート
│   └── favicon.ico
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── page.tsx                 # トップページ（診断一覧）
│   │   ├── diagnoses/
│   │   │   └── [diagnosisId]/
│   │   │       ├── page.tsx         # 診断説明・開始ページ
│   │   │       ├── questions/
│   │   │       │   └── page.tsx     # 質問ページ（CSR）
│   │   │       └── results/
│   │   │           └── [typeId]/
│   │   │               ├── page.tsx              # タイプ別結果ページ（SSG）
│   │   │               └── opengraph-image.tsx   # タイプ別OGP生成
│   │   ├── api/
│   │   │   └── og/                  # OGP生成APIエンドポイント（将来の個別OGP用）
│   │   └── layout.tsx
│   ├── components/
│   │   ├── diagnosis/               # 診断専用コンポーネント
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── RadarChart.tsx
│   │   │   └── ShareButton.tsx
│   │   └── ui/                      # shadcn/ui コンポーネント
│   ├── engine/                      # 診断エンジン（コアロジック・変更しない）
│   │   ├── scorer.ts                # スコアリング処理
│   │   ├── resolver.ts              # タイプ解決処理
│   │   └── types.ts                 # 型定義
│   ├── schemas/                     # Zod スキーマ定義
│   │   └── diagnosis.ts             # meta / questions / types / scoring の検証スキーマ
│   └── lib/
│       ├── data-loader.ts           # JSONデータ読み込み + Zodバリデーション
│       └── utils.ts
└── README.md
```

### 設計の核心：`data/` と `src/engine/` の完全分離

- **`data/`** は診断コンテンツ（増える・変わるもの）
- **`src/engine/`** は診断ロジック（一度作れば変わらないもの）

新しい診断を追加するとき、**`src/` 配下のコードには一切触れない**。`data/diagnoses/` に新しいフォルダと JSON ファイルを追加するだけで診断が動く設計にする。

---

## ルーティング設計

### URL構造

| 画面 | URL | 生成方式 |
|---|---|---|
| トップ（診断一覧） | `/` | SSG |
| 診断説明・開始 | `/diagnoses/business-skills` | SSG |
| 質問ページ | `/diagnoses/business-skills/questions` | CSR |
| タイプ別結果 | `/diagnoses/business-skills/results/strategist` | SSG |

### `[diagnosisId]/` を使わずに `/diagnoses/` 配下に置く理由

ルートに `[diagnosisId]/` を置くと、将来追加する通常ページ（`/about`, `/profile`, `/pricing` など）と衝突するリスクがある。`/diagnoses/` 名前空間に診断ルートを集約することで、プラットフォームの成長に伴うルーティングの競合を防ぐ。

### 結果ページはタイプ別固定URL

```
/diagnoses/business-skills/results/strategist
/diagnoses/business-skills/results/sales-monster
/diagnoses/business-skills/results/creator
...（16タイプ × 診断数）
```

**固定URLにする理由：**
- 「同じタイプだった」と友人に URL を共有しやすい（MBTIモデルと同じ体験）
- タイプ名・キャラクター・代表能力値を固定OGPとして表示できる
- タイプ名がURLに入るため SEO に活かしやすい
- `generateStaticParams` でビルド時に全タイプページを一括生成できる

質問への回答はクライアントサイドのみで処理し、スコアリング結果に応じてタイプ別 URL にリダイレクトする。

---

## JSONデータ管理方針

### 基本方針

- 診断データはすべて `data/diagnoses/{診断ID}/` 配下に配置
- 診断IDはスラッグ形式（例：`business-skills`, `house-check`）
- JSONスキーマを Zod で事前定義し、全診断が同じ構造に従うことを保証する
- ロード時に Zod バリデーションを実行し、スキーマ違反を即座に検出する

### JSONスキーマ概要

**meta.json（診断メタ情報）**
```json
{
  "id": "business-skills",
  "title": "社会人能力値診断",
  "description": "20問で5つの能力軸をスコアリング",
  "category": "career",
  "tags": ["社会人", "スキル", "キャリア"],
  "questionCount": 20,
  "estimatedMinutes": 3,
  "engineType": "radar",
  "axes": ["logic", "execution", "sales", "creativity", "management"],
  "typeCount": 16,
  "published": true,
  "createdAt": "2026-06-29"
}
```

**engineType** で診断エンジンの処理方式を指定する。1つのエンジンがすべての方式を処理する。

| engineType | 方式 | 用途例 |
|---|---|---|
| `radar` | 複数軸スコアリング → タイプ判定 | 社会人能力値診断 |
| `type16` | 4軸2択 → 16タイプ判定 | オリジナル16タイプ診断 |
| `branch` | 条件分岐型（フローチャート式） | 家買いたい？チェッカー |
| `score` | 単一スコアの高低判定 | ストレスチェック等 |

### 5軸（社会人能力値診断）

| axisId | 表示名 | 測定する特性 |
|---|---|---|
| `logic` | 論理力 | 論理的思考・課題の構造化 |
| `execution` | 実行力 | 行動の速さ・やりきる力 |
| `sales` | 営業力 | 伝える力・人を動かす力 |
| `creativity` | 創造力 | アイデア発想・課題の再定義 |
| `management` | 管理力 | チーム・プロセス・品質管理 |

### データ追加フロー

```
1. data/diagnoses/{new-id}/ フォルダを作成
2. meta.json / questions.json / types.json / scoring.json を配置
3. data/index.json に新しい診断を追記（初期段階）
4. デプロイ → 自動で診断が追加される
```

**コードの変更は不要。Pull Request はデータだけ。**

### `data/index.json` の管理方針

- **初期段階（〜診断数十本）**：手動で `data/index.json` を管理する
- **将来（診断が増えてきた段階）**：`data/diagnoses/*/meta.json` を自動収集するビルドスクリプトを導入し、`index.json` の手動管理を廃止する

```
# 将来の自動収集スクリプトのイメージ
scripts/build-index.ts → data/diagnoses/*/meta.json を読み込み → data/index.json を自動生成
```

---

## Zodによるスキーマ検証方針

### 目的

100本以上の診断 JSON を管理する前提で、以下のリスクを防ぐ。

- JSON の書き間違い・フィールド欠落による実行時エラー
- `engineType` の typo（例：`Radar` と書いてしまうなど）
- 型の不一致（数値を文字列で書くなど）
- 必須フィールドの欠落

### 検証対象ファイルと方針

`src/schemas/diagnosis.ts` に以下のすべての Zod スキーマを定義する。

| 対象ファイル | 検証タイミング |
|---|---|
| `meta.json` | `data-loader.ts` でのロード時 |
| `questions.json` | `data-loader.ts` でのロード時 |
| `types.json` | `data-loader.ts` でのロード時 |
| `scoring.json` | `data-loader.ts` でのロード時 |

- 開発時：バリデーションエラーを即座にコンソールに出力
- ビルド時：`generateStaticParams` でのデータロード時に自動検証。エラーがあればビルドを失敗させる

### 検証フロー

```
data-loader.ts がJSONを読み込む
  → diagnosis.ts のZodスキーマで parse()
  → 成功：型安全なオブジェクトを返す
  → 失敗：エラーメッセージと対象ファイルパスを出力してビルド停止
```

---

## OGP画像設計

### 基本方針：タイプ別固定OGP

初期段階では、ユーザーごとの完全個別生成は行わない。診断ID + タイプID の組み合わせで固定の OGP 画像を生成する。

- 実装：`src/app/diagnoses/[diagnosisId]/results/[typeId]/opengraph-image.tsx`
- Next.js の File-based OGP 機能（`opengraph-image.tsx`）を使用
- 内容：タイプ名・キャラクター・代表能力値・サービスロゴ

```
URL例：
/diagnoses/business-skills/results/strategist
→ OGP: タイプ名「戦略家」 + キャラクター画像 + 5軸レーダーチャートのサマリー
```

### 将来の個別OGP（有料版・ログイン機能導入後）

- 実装：`src/app/api/og/route.ts`（Edge Function）
- ユーザーの実際の回答スコアを反映したパーソナライズOGPを生成
- 有料詳細レポートや Human Profile のシェア時に使用

---

## 将来的なSupabase導入方針

### 導入トリガー

以下のいずれかが必要になった時点で導入する。

- ユーザーアカウント（診断履歴の保存）
- タイプ別ランキング・統計表示
- Human Profile ページ（複数診断の統合プロフィール）
- BtoB チームダッシュボード

### 導入方針

- 初期は JSON ファイルの静的読み込みのまま維持
- Supabase 導入後も `data/` の JSON はコンテンツの正とする
- 診断データは JSON → Supabase への移行ではなく、**JSON をソースとして Supabase にシード**する
- ユーザーデータ（回答・結果）のみ Supabase に保存
- `src/engine/` のロジックは Supabase 導入後も変更不要な設計にする

---

## Vercel公開前提の構成

### 静的生成（SSG）の活用

| ページ | 生成方式 | 理由 |
|---|---|---|
| トップ（診断一覧） | SSG | 全診断一覧は静的でよい |
| 診断説明・開始ページ | SSG（`generateStaticParams`） | 診断数分を事前生成 |
| 質問ページ | CSR のみ | 回答状態は `useState` で管理、サーバー不要 |
| タイプ別結果ページ | SSG（`generateStaticParams`） | 全診断 × 全タイプを事前生成 |

タイプ別結果ページは「診断数 × タイプ数」分のページをビルド時に生成するため、ランタイムコストゼロで高速表示できる。

### 環境変数管理

- `NEXT_PUBLIC_SITE_URL` — 本番URL（OGP画像URL生成に使用）
- `NEXT_PUBLIC_GA_ID` — Google Analytics
- `ANTHROPIC_API_KEY` — 有料AI機能導入時（Phase 4以降、初期は不要）
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 有料レポート決済導入時（初期は不要）
