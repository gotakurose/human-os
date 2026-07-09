# Human OS｜ビジマル診断｜UI仕様

> 文書状態：正本・実装済み
> 更新日：2026年7月10日
> 対象：Human OS / ビジマル診断

プラットフォーム共通の仕様（ドメイン、共通フッター、利用規約、プライバシーポリシー、robots.txt、sitemap.xml）は
`docs/specs/common/Human OS｜共通｜サイト・ブランド・公開仕様.md` を参照。
本文書はビジマル診断に固有の UI 仕様のみを記載する。

---

## 1. デザインコンセプト

「生物学的分類図鑑」「古書・羊皮紙文書」の視覚世界観。ウォームクリームと古書インク。
アニメーション演出は最小限。レスポンシブ対応（スマートフォンが主要環境）。

---

## 2. デザイントークン（CSS 変数）

実装ファイル：`src/app/globals.css`

| 変数 | 値 | 用途 |
|---|---|---|
| `--dossier-bg` | `#F4F0E7` | ページ背景（ウォームクリーム） |
| `--dossier-surface` | `#FCFAF5` | カード・フィールド背景 |
| `--dossier-paper` | `#F8F4EC` | 代替サーフェス（黄味がかった白） |
| `--dossier-ink` | `#1A1815` | 一次テキスト（ダークインク） |
| `--dossier-sub` | `#6B655C` | 二次テキスト |
| `--dossier-muted` | `#9A9286` | キャプション・補足 |
| `--dossier-line` | `#CDBF9F` | 主罫線（ウォームゴールド） |
| `--dossier-line-soft` | `#DDD5C2` | 薄い区切り線 |
| `--dossier-gold` | `#8C7A4B` | アクセント（アンティークゴールド） |
| `--dossier-dark` | `#14120F` | インクブラック（CTA 背景） |
| `--dossier-red-bg` | `#F3E8E3` | 致命的弱点背景 |
| `--dossier-red-line` | `#B5544A` | 致命的弱点アクセントライン |
| `--dossier-red-text` | `#6B2E2A` | 致命的弱点テキスト |
| `--dossier-orange-bg` | `#F2E9DD` | 注意・弱点背景 |
| `--dossier-orange-line` | `#B87A3D` | 注意アクセントライン |
| `--dossier-orange-text` | `#6B4523` | 注意テキスト |

Tailwind v4 の `@theme inline` ブロックで `--color-dossier-*` としてマッピング済み。

### フォント変数

| 変数 | フォールバック | 用途 |
|---|---|---|
| `--font-zen` | Hiragino Mincho ProN, Yu Mincho, serif | 見出し・タイプ名（明朝系） |
| `--font-jp` | Hiragino Sans, Noto Sans JP, sans-serif | 本文・選択肢（ゴシック系） |
| `--font-serif-en` | EB Garamond, Georgia, serif | 英語タイプ名 |
| `--font-heading` | Shippori Mincho B1, Hiragino Mincho ProN, serif | 大見出し |

---

## 3. 静的アセット一覧

実装パス（`public/` 以下、URL の `/` からアクセス可）：

| 種別 | パス |
|---|---|
| ビジマル診断 LP ヒーロー画像 | `/images/diagnoses/business-skills/hero-top-temp.png` |
| 質問画面ステージ背景 | `/images/diagnoses/business-skills/hero-question-temp.png` |
| キャラクター画像（16枚） | `/images/diagnoses/business-skills/characters/{キャラ画像名}.png` |
| 族バッジ（8種） | `/images/diagnoses/business-skills/badges/tribes/{英語キー}.png` |
| 特化個体バッジ（5種） | `/images/diagnoses/business-skills/badges/specialists/{英語キー}-specialist.png` |
| 仕切り飾り | `/images/diagnoses/business-skills/ornaments/divider-ornament.png` |
| テクスチャ | `/images/diagnoses/business-skills/textures/` |

画像ファイル名の対応は「固定名称・IDマスター §7」を参照。

---

## 4. ビジマル診断 固有ルート

| 画面 | URL | レンダリング | noindex |
|---|---|---|---|
| 診断 LP | `/diagnoses/business-skills` | SSG ● | なし |
| 質問フロー | `/diagnoses/business-skills/questions` | SSR ƒ | あり |
| 結果 | `/diagnoses/business-skills/results/{typeId}?ta=…&os=…&st=…&dc=…&av=…` | SSG ● | あり |
| 16タイプ図鑑 | `/diagnoses/business-skills/types` | SSG ● | なし |

質問フローは `src/app/diagnoses/[diagnosisId]/questions/page.tsx`
結果は `src/app/diagnoses/[diagnosisId]/results/[typeId]/page.tsx`

---

## 5. 診断 LP（`/diagnoses/business-skills`）

### ページ metadata

```
title: ビジマル診断｜280万通り以上から仕事タイプを多面的に診断
description: 40問から、16タイプ・5つの能力値・4つのスタイル軸を分析。280万通り以上の組み合わせから、あなたの仕事タイプを多面的に診断します。
```

### 構成

| セクション | 内容 |
|---|---|
| ヒーロー | ダーク背景 (`--dossier-dark`)、ヒーロー画像、診断名「ビジマル診断」、タグライン「BUSINESS ANIMAL DIAGNOSIS」、サブタイトル（40問・16タイプ・5能力値・4軸）、「診断を始める」CTA |
| この診断でわかること | 16タイプ / 4軸 / 5能力値 / 詳細な結果文章の4アイテム説明カード |
| スタイル軸説明 | 4軸の一覧（内部キー・URL パラメータは内部仕様） |
| 能力値説明 | 5能力の説明と注記（50〜100表示スコアの説明） |

### CTA ラベル

- 開始ボタン：「診断を始める」
- リンク先：`/diagnoses/business-skills/questions`

---

## 6. 質問フロー（`/diagnoses/business-skills/questions`）

実装ファイル：`src/app/diagnoses/[diagnosisId]/questions/StyleAxisQuestionFlow.tsx`

### ページ構成

| 要素 | 仕様 |
|---|---|
| 進捗表示 | `{n}/40` 右上表示 |
| 戻るボタン | 左上。最初の問は非表示。`type="button"` |
| ステージ背景 | `/images/diagnoses/business-skills/hero-question-temp.png`。`pointer-events-none` |
| 質問カード | `relative z-30 isolate pointer-events-auto`、`max-w-3xl mx-auto px-5` |
| 質問文 | `font-zen`、`fontSize: clamp(1rem, 2.5vw, 1.125rem)`、`lineHeight: 1.60`、`minHeight: 3.2em` |
| A/B カード | 「A：{テキスト}」「B：{テキスト}」縦並び2枚。`min-h-[112px]` |
| 測定バー | A↔B を示す帯。金のインジケーター（diamond）。`pointer-events: none` |
| 選択ボタン | 4択：強くA / ややA / ややB / 強くB。横並び4列。高さ `56px` |
| 選択状態 | 選択済み：ゴールドボーダー下線 + 背景 `rgba(140,122,75,0.10)` |

### 選択ボタン仕様

- `type="button"`（フォーム送信防止）
- `touch-action: manipulation`、`WebkitTapHighlightColor: transparent`
- `z-index: 40`、`pointer-events: auto`
- iOS Safari 対応：stage 背景は `pointer-events-none`、カードは `isolate`

### 回答後の動作

- 選択直後に次の質問へ遷移（即座・アニメーションなし）
- 40問完了後：採点 → 結果 URL へ `router.push()`

### noindex

質問フローは `metadata.robots = { index: false, follow: true }`

---

## 7. 結果ページ（`/diagnoses/business-skills/results/{typeId}`）

実装ファイル：`src/app/diagnoses/[diagnosisId]/results/[typeId]/page.tsx`

### URL パラメータ

| パラメータ | 内容 |
|---|---|
| `ta` | thinking_action 軸スコア（1〜4） |
| `os` | offensive_stable 軸スコア（1〜4） |
| `st` | solo_team 軸スコア（1〜4） |
| `dc` | divergent_convergent 軸スコア（1〜4） |
| `av` | 5能力 U 値（`1.{logicU}.{executionU}.{salesU}.{creativityU}.{managementU}`） |

欠損時のフォールバック：`types.json` の `representativeScores`

### 表示順

結果文章・生成仕様 §2 の23項目順に従う。

### 主要コンポーネント

| コンポーネント | 役割 |
|---|---|
| `ResultClient.tsx` | クライアント側フォールバック値管理 |
| `ResultBadgeGroup.tsx` | 族バッジ・特化個体バッジのグループ |
| `ResultAbilitySection.tsx` | 五角形レーダー + 数値表示（D スコア 50〜100） |
| `PentagonRadarChart.tsx` | SVG レーダーチャート |
| `DynamicCopySlot.tsx` | 4軸動的文章の挿入 |
| `ProseBody.tsx` | 固定文章本文レンダリング |
| `ResultShareSection.tsx` | X・LINE・URL コピー |

### キャラクター画像

各 typeId に対応するキャラクター画像を表示。
`TYPE_DISPLAY_ASSETS`（`result-assets.ts`）でマッピング管理。

### 仕切り飾り

`<DividerOrnament>` = `/images/diagnoses/business-skills/ornaments/divider-ornament.png`

### noindex

結果ページは各ページ個別に noindex を設定。

---

## 8. 16タイプ図鑑（`/diagnoses/business-skills/types`）

実装ファイル：`src/app/diagnoses/business-skills/types/page.tsx`

```
title: ビジマル16タイプ図鑑
description: ビジマル診断に登場する、16種類のビジネスアニマルの一覧。各タイプのキャラクター、動物タイプ、一言説明を確認できます。
```

各タイプのキャラクター画像・日本語タイプ名・動物タイプ・キャッチコピーを一覧表示。
`fixed-copy.json` の `catch.text` を使用。

---

## 9. レスポンシブ仕様

| ブレークポイント | 実装目標 |
|---|---|
| モバイル（< 768px） | 主要ターゲット。1カラム。フォントは `clamp()` 対応 |
| タブレット（768px〜） | `md:` Tailwind クラスで調整 |
| デスクトップ（1024px〜） | `max-w-3xl` / `max-w-[1040px]` で最大幅制限 |

フォントサイズ可変：`clamp(0.8125rem, 1.6vw, 0.9375rem)`（選択肢）/ `clamp(1rem, 2.5vw, 1.125rem)`（質問文）

---

## 10. 変更禁止

- デザイントークン変数名（CSS 変数）
- デザインコンセプト（世界観）
- 質問フローの選択肢ラベル（強くA / ややA / ややB / 強くB）
- 結果ページの URL パラメータ形式
- ルート構造（URL）
- 各ページの title / description
