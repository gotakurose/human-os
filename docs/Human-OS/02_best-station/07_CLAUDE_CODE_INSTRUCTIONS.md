# Human OS｜無理するな、お前が住むべき最寄り駅｜Claude Code修正指示

- 文書種別：今回の実装修正指示
- バージョン：v0.3.1-review
- 更新日：2026-07-10
- 正本ではない

## 目的

既存のbest-station試作を維持しながら、以下を実装してください。

1. 質問表示文・小見出しを、具体的で分かりやすいギャル口調へ全面リライト
2. 質問画面から内部観測意図を削除
3. 主結果・別候補に加え、「惹かれやすいけど、無理が出やすい駅」0〜1駅を算出
4. 結果画面を、定量ロジックに基づく定性分析中心へ拡張
5. 生のスコア内訳をユーザー向け主表示から外す
6. best-stationのトップ・質問・結果・Aboutを、同一のギャルPOPデザインシステムへ統一する

## 1. 作業対象

今回の対象は`best-station`だけです。

最初に以下を全文確認してください。

- `docs/workpacks/best-station/01_MASTER_SPEC.md`
- `docs/workpacks/best-station/02_OBSERVATION_MODEL_SPEC.md`
- `docs/workpacks/best-station/03_QUESTIONS_SCORING_SPEC.md`
- `docs/workpacks/best-station/04_STATION_MATCHING_SPEC.md`
- `docs/workpacks/best-station/05_RESULT_COPY_SPEC.md`
- `docs/workpacks/best-station/06_UI_SEO_LEGAL_SPEC.md`
- 現在のbest-station実装コード・JSON・テスト・シミュレーション

`02_OBSERVATION_MODEL_SPEC.md`はロック済みです。変更しないでください。

## 2. 禁止事項

- ビジマル診断の変更・流用
- E・T・B・I・D・F・Gの定義変更
- fieldId、回答value、採点係数の無断変更
- 駅特徴値・既存マッチング重みの無断変更
- 質問数を減らすことを目的とした削除
- 欠損を50にする
- I・Dを主結果順位の積極加点にする
- 新規パッケージ追加
- commit、push、deploy
- docs/specsへの昇格

## 3. Phase 0：best-station全体のギャルPOPデザインシステム

### 3.1 適用範囲

以下の4ルートへ共通適用してください。

- `/diagnoses/best-station`
- `/diagnoses/best-station/questions`
- `/diagnoses/best-station/results`
- `/diagnoses/best-station/about`

変更はbest-station配下へ閉じてください。

- Human OS共通トップのデザインを変更しない
- ビジマル診断を変更しない
- `src/app/layout.tsx`やglobal CSSへ診断固有装飾を追加しない
- best-station専用layout、CSS Module、CSS変数、コンポーネントを使用する

### 3.2 コンセプト

`ギャル雑誌的な強さ × 現代Webの可読性 × 深い診断の信頼感`

- 明るく、近く、少し大げさ
- 派手さは大見出し、短いラベル、選択反応へ集中
- 本文、補足、分析、免責は落ち着いて読ませる
- 特定の雑誌、ブランド、人物、作品、年代を模倣しない

### 3.3 フォント

質問タイトル、診断名、結果駅、ギャルの一発ツッコミ用に、best-station内だけで日本語ディスプレイフォントを読み込んでください。

第一候補：

- `next/font/google`の`Dela Gothic One`

条件：

- 新規npmパッケージは追加しない
- build時に利用不能なら、別の日本語POP書体へ変更する
- それも難しい場合は、既存Noto Sans JPの900ウェイト＋縁・影・マーカー装飾へフォールバックする
- ディスプレイ書体は大見出し中心。本文、回答、補足、免責には使用しない

本文・回答は既存Noto Sans JP系を使用してください。

### 3.4 初期デザイントークン

best-station専用CSS変数として実装してください。

```css
--bs-bg: #FFF8F1;
--bs-surface: #FFFFFF;
--bs-ink: #211920;
--bs-muted: #71656D;
--bs-pink: #FF4F9A;
--bs-coral: #FF765B;
--bs-yellow: #FFD84D;
--bs-aqua: #52D8D2;
--bs-lavender: #B9A5FF;
--bs-border: #241C22;
```

- 一画面で強く使う差し色は原則2色まで
- 本文は濃色で高コントラストを維持
- 色だけで状態を伝えない

### 3.5 共通表現

使用可能：

- 2px前後の濃色枠
- 2〜4pxのオフセット影
- 角丸12〜20px
- ステッカー風ラベル
- 手書きマーカー風の背景・下線
- 星、ハート、キラキラの単純なCSS図形または小型SVG

制限：

- 装飾は1画面3個程度まで
- 絵文字へ依存しない
- 全面ラメ、常時点滅、過度なグラデーションを使わない
- 長文分析カードは傾けない

### 3.6 回答ボタン

- 未選択：白または薄い暖色、濃色2px枠、軽いオフセット影
- 選択：ピンク等の主アクセント、濃色枠、太字、状態アイコン
- hover：1〜2px上へ
- active：影を縮め、押した感を出す
- focus-visibleを明確にする
- タップ領域44px以上
- 文字サイズを下げてPOPさを作らない

### 3.7 ページ別

- トップ：最も華やか。診断名、短い価値訴求、CTAを強くする
- 質問：大見出しだけPOP。小見出し、補足、回答は読みやすくする
- 結果：駅名と一発ツッコミを強く、分析本文は白いカード等で落ち着かせる
- About：装飾を減らし、免責とリンクを読みやすくする

### 3.8 モーション

- 選択時100〜160ms程度の小さな押下・バウンス
- 画面遷移150〜220ms程度
- 結果駅の登場演出は初回のみ短く
- `prefers-reduced-motion`に対応
- 常時揺れる・点滅する演出は禁止

### 3.9 先に共通化するもの

必要に応じ、best-station内に以下を作成してください。

- 専用`layout.tsx`
- 専用CSS Moduleまたは共通CSS Module
- ディスプレイ見出しコンポーネント
- ステッカーラベル
- POPな回答ボタンの共通スタイル
- 分析カード

無意味な分割は避けてください。

## 4. Phase 1：質問表示文のリライト

### 3.1 変更可能

- stepの表示title
- stepの回答補助description
- fieldの表示label
- optionの表示label
- UI専用メタデータ

### 3.2 変更禁止

- stepId
- fieldId
- option value
- required
- fieldType
- scoring接続
- 保存構造

### 3.3 リライトルール

- 一読で何に答えるか分かる
- 抽象語ではなく生活場面で聞く
- 小見出しだけで回答対象が分かる
- ギャル口調は自然な範囲
- 明確さ80%、ユーモア20%
- 内部意図・指標名・採点理由を画面へ出さない
- 回答者の属性を嘲笑しない
- 都会・田舎に正解を作らない

例：

- `騒音レベル` → `夜、家にいて外の音は気になる？`
- `人の密度` → `家の近く、人多い？`
- `生活の便利さ` → `スーパー・病院・ご飯、近所でだいたい済む？`
- `緑・余白` → `家の周り、緑とか空の広さある？`
- `room comfort`相当 → `今の家、正直狭くない？`
- `housing burden`相当 → `ぶっちゃけ、その家賃生活に響いてる？`

現在画面にある「刺激必要量」「回復環境必要量」等の内部観測意図は表示しないでください。

### 3.4 全30ステップ監査

全ステップについて、title、description、各field label、各option labelをレビューし、意味が曖昧な箇所を修正してください。

質問数は今回変更しません。30ステップを維持してください。

## 5. Phase 2：質問情報価値監査

コード変更とは別に、以下の表をレポートしてください。

- fieldId
- 主観測指標
- 結果文章で使用するタグ
- 駅選定での用途
- 欠損時の影響
- 他質問との重複
- 将来削除候補か

今回は削除しません。質問削減候補がある場合も、情報価値監査だけを提出してください。

## 6. Phase 3：無理が出やすい駅

### 5.1 位置づけ

表示名は原則として以下です。

`惹かれやすいけど、無理が出やすい駅`

「最も向いていない駅」「ワースト駅」とは表示しないでください。

### 5.2 選定ロジック

現在の駅特徴とマッチング内訳を使用し、以下を実装してください。

- `aspirationAffinity`：観測済みI項目と駅便益特徴の一致
- `actualMismatch`：便益不足、耐性超過、経済、目的地、住空間の不一致
- aspirationとmismatchの両方が一定以上の駅だけ候補
- 主結果・別候補は除外
- I coverageが不足する場合は非表示
- Dは文章説明に使えるが、Dだけで駅を選ばない
- 単純な最低総合点駅を選ばない

既存駅特徴マッピングを再利用し、I01〜I07はE01〜E07と同じ便益空間に接続してください。観測済みI項目だけでaspirationAffinityを計算し、coverageを保持してください。

初期閾値・係数は、コード上で定数名とコメントを持たせ、テスト・シミュレーション可能にしてください。特定駅を出すために駅値を変更しないでください。

### 5.3 保存型

結果payloadへ以下を追加してください。

- `temptingMismatchStation`：駅結果またはnull
- `aspirationAffinity`
- `actualMismatch`
- `reasonTags`
- `warningTags`
- `confidence`
- `coverage`

古いsessionStorage payloadは安全に無効化またはマイグレーションしてください。保存キーまたはpayload versionを更新してください。

## 7. Phase 4：結果文章の定性強化

### 6.1 表示構成

1. 主結果駅
2. ギャルの一発ツッコミ
3. 本当に必要な暮らし
4. 今どこで無理が出ているか
5. 理想と実態のズレ
6. 推薦理由
7. 推薦駅の注意点
8. 惹かれやすいけど、無理が出やすい駅
9. 別候補2駅と違い
10. 救済コメント
11. 免責

### 6.2 定量と定性

- 内部スコア、タグ、信頼度を根拠にする
- ユーザーへ生の0〜100点を大量表示しない
- 現在表示中のスコア内訳は、ユーザー向け画面から削除または開発用に限定する
- 単なる特徴箇条書きではなく、一つの生活仮説として文章化する
- 根拠が弱い原因は断定しない
- 現在駅名を推定しない

### 6.3 ギャル口調

- 近い友人の距離感
- 一発ツッコミは強く、分析本文は読みやすく
- 「〜っしょ」「〜じゃん」「〜じゃね？」等を自然な範囲で使用
- 全文を砕けすぎた口調にしない
- 都会・田舎・駅・年収・家庭環境を侮辱しない
- 今の暮らしが合っている場合は肯定する
- 憧れや未練は根拠がある場合だけ指摘する

### 6.4 結果コピー

`result-copy.json`を更新し、以下のモジュールを扱えるようにしてください。

- `result_declaration`
- `sharp_opening`
- `core_environment_analysis`
- `current_strain_analysis`
- `ideal_reality_gap`
- `station_fit_reason`
- `station_tradeoff`
- `tempting_mismatch_station`
- `alternative_station_comparison`
- `supportive_closing`

必要な新規copy部品を追加して構いません。既存copy IDを削除する場合は差分を報告してください。

## 8. Phase 5：結果UI

- ギャル案内役へ表記を変更
- オジサン表記・東北方言を削除
- スコア数値を主表示しない
- 文章を読みやすいセクションへ分割
- 無理が出やすい駅は警告色で煽りすぎず、相性の話として表示
- 無理が出やすい駅がnullならセクションを表示しない
- 別候補2駅との違いを短く表示
- センシティブ回答値は表示しない
- 既存best-stationの明るいUIを土台にし、ビジマルの世界観を流用しない
- 結果駅名と一発ツッコミはディスプレイ書体で大きく見せる
- 分析本文はNoto Sans JP系、白い読み物カード、十分な行間で表示する
- ステッカー風ラベルやマーカーは、セクション識別に限定する

完成キャラクター画像は不要です。テキストと簡易プレースホルダーで成立させてください。

## 9. テスト

既存テストに加え、最低限以下を確認してください。

1. 30ステップ、fieldId、value、採点結果が表示文変更前後で不変
2. 質問画面に内部指標名・観測意図が出ない
3. 主結果・別候補・無理が出やすい駅が重複しない
4. I coverage不足時は無理が出やすい駅がnull
5. aspirationが低い最低点駅をワーストとして選ばない
6. aspirationとmismatchが高いケースで候補が出る
7. Dだけを変えて候補駅が決まらない
8. 結果に年収・家賃・都道府県・支援値が表示されない
9. スコア内訳がユーザー向け画面に主表示されない
10. 同一回答で同一文章・結果が再現される
11. 都会・田舎を侮辱する固定文がない
12. 古いsessionStorage payloadでクラッシュしない
13. best-station以外のルートでフォント・色・CSSが変化しない
14. 360px幅で大見出し・回答・装飾が横にはみ出さない
15. 本文・回答・免責がディスプレイ書体になっていない
16. focus-visibleと44px以上のタップ領域が保たれる
17. prefers-reduced-motion時に主要操作が成立する

## 10. シミュレーション

既存ペルソナに以下を追加または監査してください。

- 都会へ惹かれるが回復環境・混雑耐性が合わない
- 田舎へ惹かれるが利便性・即応性を手放せない
- 今の環境が十分合っている
- 高収入だが過剰節約
- 低収入だが支援により現実性がある
- I coverage不足

各ケースで、主結果、別候補、無理が出やすい駅、文章に使う主要タグを出力してください。

## 11. 検証

実際のpackage.jsonに従い、最低限以下を実行してください。

```powershell
npm run lint
npx tsc --noEmit
npm run build
npx tsx scripts/simulate-best-station.ts
```

利用可能なテストコマンドがある場合は実行してください。

## 12. 変更を許可する範囲

- `data/diagnoses/best-station/questions.json`
- `data/diagnoses/best-station/result-copy.json`
- `src/lib/diagnoses/best-station/`内の必要ファイル
- `src/components/diagnoses/best-station/`内の必要ファイル
- `src/app/diagnoses/best-station/`内の必要ファイル
- best-station用テスト・シミュレーション

駅特徴値、matching-rulesの既存重みを変更する必要がある場合は、勝手に変更せず提案として停止してください。

## 13. 完了報告

以下の順で報告してください。

A. 変更ファイル
B. ギャルPOPデザインシステムの実装内容
C. トップ・質問・結果・Aboutの変更概要
D. フォント・CSSのスコープ確認
E. 質問表示文の変更概要
F. 内部観測意図を削除した箇所
G. 情報価値監査
H. 無理が出やすい駅の選定式・閾値
I. 結果文章モジュール
J. 結果UI変更
K. アクセシビリティ・レスポンシブ確認
L. テスト結果
M. シミュレーション結果
N. lint・typecheck・build
O. 仕様との差分・暫定事項
P. 目視確認URL
Q. git diff --stat
R. git status --short

commit、push、deployは行わず停止してください。
