# Human OS｜ビジマル診断｜実装・QAチェックリスト

> 文書状態：正本・実装済み
> 更新日：2026年7月13日
> 対象：Human OS / ビジマル診断

---

## 1. V1 実装済み項目（2026年7月10日時点）

### コアエンジン

- [x] 40問・4件法 StyleAxisQuestionFlow（`StyleAxisQuestionFlow.tsx`）
- [x] 4軸採点・16タイプ判定（`src/engine/dispatcher.ts`）
- [x] 4文字コード生成（`computeBaseCode` in `page.tsx`）
- [x] 5能力 U 値計算（`calculateAbilityUScores` in `ability-scorer.ts`）
- [x] U → V 変換（`uScoresToV`）
- [x] V → 表示スコア D（`vToDisplayScore`）：`50 + Math.round(v * 0.5)`
- [x] `av` URL パラメータ生成（`buildAvParam`）
- [x] 特化個体判定（内部 U 値ベース、`minGap=10`、単独1位条件）
- [x] 族バッジ判定（dominant 軸）
- [x] 4軸動的文章選出（dominant / soft / balanced ロジック）

### データ

- [x] 質問文 v5-final（`data/diagnoses/business-skills/questions.json`）
- [x] 固定文章 v7-final（`data/diagnoses/business-skills/fixed-copy.json`）
- [x] 4軸動的文章 v3-final（`data/diagnoses/business-skills/dynamic-copy.json`）
- [x] 16タイプ定義（`data/diagnoses/business-skills/types.json`）

### UI

- [x] 診断 LP（`/diagnoses/business-skills`）
- [x] 質問フロー（`/diagnoses/business-skills/questions`）— ダイアモンドボタン UI（`style-axis-question-flow.module.css`）
- [x] 16タイプ結果ページ（`/diagnoses/business-skills/results/{typeId}`）
- [x] 五角形レーダーチャート（`PentagonRadarChart.tsx`）
- [x] 表示スコア D（50〜100）適用（`ResultAbilitySection.tsx`）
- [x] 族バッジ・特化個体バッジ（`ResultBadgeGroup.tsx`）
- [x] 4軸動的文章スロット（`DynamicCopySlot.tsx`）
- [x] X・LINE・URL コピー共有（`ResultShareSection.tsx`）
- [x] 16タイプ図鑑（`/diagnoses/business-skills/types`）
- [x] 辛辣な一文（`sarcasticTitle` のみ表示、本文非表示）
- [x] 仕切り飾り（`divider-ornament.png`）

### SEO・法務

- [x] 質問フロー `noindex`（`metadata.robots = { index: false, follow: true }`）
- [x] 結果ページ `noindex`
- [x] sitemap.xml（質問・結果は掲載なし）
- [x] robots.txt（Allow: /）
- [x] 共通 metadata（root layout）
- [x] 利用規約 `/terms`
- [x] プライバシーポリシー `/privacy`

### V1 改修 FIX

- [x] 質問文 v4-final 適用
- [x] 固定文章 v7-final 適用
- [x] 辛辣コメント：見出しなし表示、本文非表示
- [x] 仕事の思考回路：弱みや改善提案を除いた記述
- [x] 向いている／避けたい仕事：職業として想像できる粒度に統一
- [x] 向いている・避けたい仕事 同一ラベル最大2タイプ（v7-final 確認済み）
- [x] 4軸動的文章 v3-final 適用
- [x] 表示スコア 50〜100 変換（`vToDisplayScore`）適用
- [x] 診断説明ページの能力値注記を「50〜100の表示スコア」に更新
- [x] AdSense Script を root layout から削除（hydration エラー修正）
- [x] iOS Safari ボタンタップ対策（pointer-events、touch-action、z-index、type="button"）
- [x] 質問文 `<p>` に `minHeight: 3.2em` 追加

---

## 2. V1 スコープ外・未実装

- [ ] OGP 画像生成（`public/images/og/` は空）
- [ ] Google Analytics 4
- [ ] Vercel Analytics / Speed Insights
- [ ] AdSense 再導入（再導入時は §5 参照）
- [ ] 問い合わせフォーム
- [ ] アカウント・診断履歴保存
- [ ] AI 生成テキスト
- [ ] カスタム 404 / error / global-error ページ

---

## 3. 既知の技術負債（別修正候補）

コード変更は本リストの記録のみ。仕様書確定と同時にコードを変更しない。

| # | 項目 |
|---|---|
| 1 | `meta.json.title` が旧称「社会人能力値診断」のまま |
| 2 | `package.json` の `simulate:business-skills` が存在しないファイルを参照 |
| 3 | `ResultSpecialistBadge.tsx` と `ResultStyleBadge.tsx` が現行結果ページで未使用 |
| 4 | radar 用 `QuestionFlow.tsx`、`scorer.ts`、`resolver.ts` が残存 |
| 5 | `type-compatibility.ts` が現行 UI で未使用 |
| 6 | `types.json` に旧互換フィールドが残存 |
| 7 | `result-assets.ts` の `oneLiner` が未使用 |
| 8 | `fixed-copy.json` の `sarcasticBody` は JSON に存在するが画面では非表示 |

---

## 4. 将来 QA テンプレート（次回実装変更時に使用）

### コードチェック

```
git diff --check          # whitespace error なし
npm run lint              # ESLint PASS
npm run type-check        # TypeScript PASS
npm run build             # build PASS
git status                # 予定外変更ファイルなし
```

### 質問・採点変更時

- [ ] 16タイプすべてへの到達可能性を確認
- [ ] 軸スコアのエッジケース（全A、全B、中間）
- [ ] 5能力 U 値の最大値・最小値境界確認
- [ ] 特化個体 minGap=10 の境界確認
- [ ] モンテカルロシミュレーション再実行（`scripts/simulate-five-abilities.ts`）

### 5能力変更時

- [ ] 表示スコア D（50〜100）が全問で正しく出力されるか
- [ ] 特化個体率が実際のユーザー分布で過剰・過少になっていないか

### モバイルレイアウト QA（< 768px）

- [ ] Q1 と Q14（大問最長）で `contentSheet.height` が 520px で一致
- [ ] Q1 と Q14 で `promptArea.top` / `promptArea.height`（120px）が同一
- [ ] Q1 と Q14 で `dividerWrap.top` が同一
- [ ] Q1 と Q14（A/B 最長）で `abSection.top` / `abSection.height`（220px）が同一
- [ ] A/B 文章量が変わっても `answerButtons.top` が全40問で同一
- [ ] ≤360px で質問文が 22px（font-size: 20px が適用されていない）
- [ ] 360px 幅で全40問オーバーフローなし（Q24 の長大問・長B文章含む）
- [ ] 390px 幅で全40問オーバーフローなし
- [ ] `contentSheet` に `overflow: hidden` 相当のクリップが効いている
- [ ] PC（≥768px）で `contentSheet.height` が `auto` になっている（520px になっていない）

### PC レイアウト QA（≥768px）

- [ ] Q1（大問1行、A/B各1行）と Q14（大問2行、B2行）で `questionPanel.height` が完全一致
- [ ] 大問1行（Q1）と大問2行（Q14）で `promptArea.top` / `promptArea.height` が同一
- [ ] 大問1行（Q1）と大問2行（Q14）で `divider.top` が同一
- [ ] A/B文章1行（Q1）と2行（Q4）で `comparisonArea.top` / `comparisonArea.height` が同一
- [ ] A/B文章量が変わっても `answerButtons.top` が全40問で同一
- [ ] A ラベル上端と B ラベル上端が1px以内で一致
- [ ] A 本文上端と B 本文上端が1px以内で一致
- [ ] 短い A/B 文章が垂直中央へ移動していない（上揃え）
- [ ] B 縦棒が B 文章の左側にある（中央区切り線に見えない）
- [ ] Q24（最長大問・最長B文章）で各領域がオーバーフローしない

### iOS・ブラウザ QA

- [ ] iPhone Safari で質問ボタン4択すべてタップ反応する
- [ ] iPhone Safari で回答後に次問題へ遷移する
- [ ] 40問完了後に結果ページへ遷移する
- [ ] 結果 URL を直接開いても正しく表示される
- [ ] 共有 URL（X・LINE）が正しく生成される
- [ ] 360px 幅で全40問オーバーフローなし（Q24 の長大問・長B文章含む）
- [ ] 390px 幅で全40問オーバーフローなし

### SEO・法務 QA

- [ ] 結果ページに noindex がある
- [ ] 質問フローに noindex がある
- [ ] sitemap.xml が最新ルートのみ含む
- [ ] AdSense 追加時はプライバシーポリシー更新

---

## 5. AdSense 再導入チェックリスト

AdSense を再導入する場合はすべてを同時に実施する。

- [ ] AdSense スクリプトを `<head>` 相当の正しい位置に配置（`</body>` 後・`</html>` 内へ置かない）
- [ ] React hydration エラーが発生しないことを確認
- [ ] `public/ads.txt` の内容確認
- [ ] プライバシーポリシーの Cookie・広告項目を更新
- [ ] 外部送信説明を実態に合わせて更新

---

## 6. 参照

| 仕様 | ファイル |
|---|---|
| 質問・採点・判定 | `Human OS｜ビジマル診断｜質問・採点・判定仕様.md` |
| 結果文章・生成 | `Human OS｜ビジマル診断｜結果文章・生成仕様.md` |
| UI | `Human OS｜ビジマル診断｜UI仕様.md` |
| 固定名称・ID | `Human OS｜ビジマル診断｜固定名称・IDマスター.md` |
| 総合・運用 | `Human OS｜ビジマル診断｜総合・運用マスター.md` |
| プラットフォーム共通 | `docs/specs/common/` |
