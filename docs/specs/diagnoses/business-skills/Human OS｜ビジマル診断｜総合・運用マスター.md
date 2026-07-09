# Human OS｜ビジマル診断｜総合・運用マスター

> 文書状態：正本・実装済み
> 更新日：2026年7月10日
> 対象：Human OS / ビジマル診断

---

## 1. ブランドと構造

| 項目 | 値 |
|---|---|
| 上位ブランド | Human OS |
| 診断名 | ビジマル診断 |
| 説明名称 | ビジネスアニマル診断 |
| 診断対象 | 仕事における思考・行動・判断・役割傾向 |
| diagnosisId | `business-skills` |
| 本番 URL | `https://human-os.site/diagnoses/business-skills` |
| 公開日基準 | 2026年7月8日 |

Human OS とビジマル診断を同一名称として扱わない。Human OS はプラットフォーム、ビジマル診断はその中の診断コンテンツである。

---

## 2. V1 の固定構造

| 項目 | 値 |
|---|---|
| 質問 | 40問・4件法 |
| タイプ | 16タイプ |
| スタイル軸 | 4軸 |
| 能力値 | 5能力 |
| 族バッジ | 8種類から必ず1個 |
| 特化個体バッジ | 条件該当時のみ最大1個 |
| 固定文章 | 16タイプ分（`data/diagnoses/business-skills/fixed-copy.json`） |
| 4軸動的文章 | 25パーツ（`data/diagnoses/business-skills/dynamic-copy.json`） |
| 結果保存 | サーバー保存なし。URLへ格納 |
| AI 生成 | V1 では使用しない |

---

## 3. V1 実装・公開状態

### 実装・公開済み

- Human OS トップ
- ビジマル診断説明・開始ページ
- 40問の質問フロー
- 16タイプ判定
- 4軸と4文字コード
- 5能力値と五角形レーダー
- 族バッジ
- 特化個体バッジ
- 固定文章（v7-final）
- 4軸動的文章（v3-final）
- X・LINE・URL コピー共有
- ビジマル 16タイプ図鑑
- 利用規約
- プライバシーポリシー
- robots.txt
- sitemap.xml
- 共通 metadata
- 本番独自ドメイン

### V1 未実装・スコープ外

- 専用 OGP 画像生成（`public/images/og/` は存在するが空）
- Google Analytics 4
- Vercel Analytics / Speed Insights
- 広告配信タグ・AdSense（root layout から削除済み）
- アフィリエイト計測
- 問い合わせフォーム
- アカウント・診断履歴保存
- 複数診断の統合表示
- AI マスター診断
- 有料 AI レポート
- PDF レポート
- BtoB 管理画面
- カスタム 404 / error / global-error ページ

---

## 4. V1 改修 FIX で変更したもの

実施済み（2026年7月10日時点）：

1. 質問文40問を、軸・ファセット・A/B極性・能力寄与を変えず読みやすくした（v4-final）
2. 16タイプ固定文章を全面改修した（v7-final）
3. 辛辣な一文は見出しなしで表示し、辛辣コメント本文は表示しない
4. 仕事の思考回路は判断手順のみ記載し、弱みや改善提案を混ぜない
5. 向いている／避けたい仕事は職業として想像できる粒度へ統一
6. 同一ラベルを原則2タイプ以内
7. 画面表示スコアを50〜100へ変換（`vToDisplayScore`）
8. 4軸動的文章を役割混線を除いた最終版へ更新（v3-final）
9. `ability-scorer.ts` へ `vToDisplayScore` / `uScoresToDisplayScores` を追加
10. `ResultAbilitySection.tsx` にて表示スコア 50〜100 を適用
11. 診断説明ページの能力値注記を更新
12. iPhone タップ対策（pointer-events、touch-action、z-index、hydration エラー修正）

### 変更しなかったもの

- 質問数、順番、4軸、ファセット、A/B極性
- 5能力の定義、36寄与、能力別観測数
- 4軸採点、16タイプ判定、4文字コード
- `av` 形式と U 値
- 特化個体の能力別閾値、`minGap=10`、単独1位条件
- 族バッジと4軸動的文章の選出ロジック
- typeId、日本語タイプ名、英語名、動物、画像

---

## 5. 正式 Git 基準

| 項目 | 値 |
|---|---|
| 正式ブランチ | `preview-qa` |
| V1 コミット | `1f37631` |
| V1 タグ | `v1.0.0` |
| 旧 `master` | 参照しない |
| `stash@{0}` | `WIP docs sync after v1.0.0`。read-only 確認のみ。pop/apply 禁止 |

---

## 6. 参照優先順位

1. ユーザーの最新の明示指示
2. 本文書および各診断固有正本
3. 実装コード・実装 JSON・公開挙動
4. 共通仕様
5. 過去資料・旧仕様書・会話履歴

---

## 7. V1 変更禁止事項

明示的な再決定なしに以下を変更しない。

- 質問数、質問順、質問文、A/B 回答文
- 対象軸、ファセット、A/B 極性
- 4件法の点数
- 16タイプの typeId・日本語名・基準コード
- 5能力の名称・定義・寄与36回答
- U値・V値の計算式
- `av` 形式
- 特化個体の能力別閾値と minGap
- 族バッジと dominant 軸の共通判定
- `fixed-copy.json` の固定文章
- `dynamic-copy.json` の25パーツ
- 結果ページの主要表示順
- `human-os.site` ドメイン

---

## 8. 既知の技術負債（別修正候補）

文書確定と同時にコード変更しない項目：

1. `meta.json.title` が旧称「社会人能力値診断」のまま
2. `package.json` の `simulate:business-skills` が存在しないファイルを参照
3. `ResultSpecialistBadge.tsx` と `ResultStyleBadge.tsx` が現行結果ページで未使用
4. radar 用 `QuestionFlow.tsx`、`scorer.ts`、`resolver.ts` が残存
5. `type-compatibility.ts` が現行 UI で未使用
6. `types.json` に旧互換フィールドが残存
7. `result-assets.ts` の `oneLiner` が未使用
8. `fixed-copy.json` の辛辣コメント本文は JSON に存在するが画面では未表示

---

## 9. QA 原則

- スクリーンショット取得を Claude Code へ依頼しない
- PC・iPhone の目視確認はユーザーが実施する
- コード報告をそのまま完了扱いにしない
- `git status`、`git diff`、lint、typecheck、build、simulation を確認
- 予定外のファイル変更を確認
- 質問・採点変更時は16タイプ到達と分布を再検証
- 5能力変更時は境界値・分布・特化個体率を再検証

---

## 10. 公開後の更新判断

以下を追加する場合は、公開前に法務・SEO・プライバシー仕様を更新する。

- Analytics
- 広告・AdSense・アフィリエイト
- 問い合わせ
- アカウント
- 診断履歴保存
- AI API
- 決済・有料レポート
- OGP 画像生成
