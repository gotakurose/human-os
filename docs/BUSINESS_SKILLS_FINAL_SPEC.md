# 社会人能力値診断 — 確定仕様書

> このドキュメントは実装前の確定仕様を記録するものです。
> UI・質問設計の実装には別途このドキュメントを参照してください。

---

## 1. 診断概要

| 項目 | 値 |
|------|-----|
| 診断名 | 社会人能力値診断 |
| ID | `business-skills` |
| エンジン | radar |
| 最終タイプ数 | 16 |
| 最終質問数 | 20（現在は5問MVP版） |
| カテゴリ | キャリア |

---

## 2. 5能力値（Ability Scores）

診断結果のレーダーチャートに表示される5軸。スコアは0〜100。

| 日本語 | キー | 意味 |
|--------|------|------|
| 論理力 | `logic` | 筋道を立てて考え、根拠をもとに判断する力 |
| 実行力 | `execution` | 行動に移し、最後まで完遂する力 |
| 営業力 | `sales` | 人を動かし、合意を取り、関係を構築する力 |
| 創造力 | `creativity` | 既存の枠を超えて新しいものを生み出す力 |
| 管理力 | `management` | 人・プロセス・リスクを整えて安定させる力 |

---

## 3. 4スタイル軸（Style Axes）

タイプ判定に使う4つのバイナリ軸。各軸は1〜4の4段階で表示。

### 軸一覧

| 軸名 | キー | 左極（1） | 右極（4） | 意味 |
|------|------|-----------|-----------|------|
| 思考型 / 行動型 | `thinkingAction` | thinking | action | 意思決定のテンポ。考えてから動くか、動きながら考えるか |
| 攻め型 / 安定型 | `offensiveStable` | offensive | stable | 成果への向き合い方。勝ちに行くか、崩さず積み上げるか |
| 個人突破型 / 組織推進型 | `soloTeam` | solo | team | 成果を出す単位。自分で突破するか、人を巻き込んで進めるか |
| 発散型 / 収束型 | `divergentConvergent` | divergent | convergent | 思考の扱い方。可能性を広げるか、絞って完了させるか |

### 4段階表示の方針

5段階にすると「真ん中」が生まれるため、必ず4段階にする。

```
思考型　●ーーー　行動型  ← 強い思考型 (値: 1)
思考型　ー●ーー　行動型  ← 思考型寄り (値: 2)
思考型　ーー●ー　行動型  ← 行動型寄り (値: 3)
思考型　ーーー●　行動型  ← 強い行動型 (値: 4)
```

現行の16タイプは純粋なバイナリ分類なので、値は 1 または 4 を使用。
詳細スペクトラム（2/3）は将来の20問版で活用予定。

---

## 4. 16タイプ一覧

### 思考型 × 攻め型

| No. | タイプ名 | ID | thinkingAction | offensiveStable | soloTeam | divergentConvergent |
|-----|----------|-----|----------------|-----------------|----------|---------------------|
| 1 | 事業構想家 | `vision-architect` | 1 | 1 | 1 | 1 |
| 2 | 勝ち筋ハンター | `win-hunter` | 1 | 1 | 1 | 4 |
| 3 | 企画軍師 | `strategy-commander` | 1 | 1 | 4 | 1 |
| 4 | 攻城参謀 | `siege-advisor` | 1 | 1 | 4 | 4 |

### 思考型 × 安定型

| No. | タイプ名 | ID | thinkingAction | offensiveStable | soloTeam | divergentConvergent |
|-----|----------|-----|----------------|-----------------|----------|---------------------|
| 5 | 独創の発明家 | `solo-inventor` | 1 | 4 | 1 | 1 |
| 6 | 精密スナイパー | `precision-sniper` | 1 | 4 | 1 | 4 |
| 7 | 構造ハッカー | `structure-hacker` | 1 | 4 | 4 | 1 |
| 8 | 城塞の守護者 | `fortress-guardian` | 1 | 4 | 4 | 4 |

### 行動型 × 攻め型

| No. | タイプ名 | ID | thinkingAction | offensiveStable | soloTeam | divergentConvergent |
|-----|----------|-----|----------------|-----------------|----------|---------------------|
| 9 | 突撃クリエイター | `assault-creator` | 4 | 1 | 1 | 1 |
| 10 | 営業モンスター | `sales-monster` | 4 | 1 | 1 | 4 |
| 11 | 巻き込みプロデューサー | `producer` | 4 | 1 | 4 | 1 |
| 12 | 前線指揮官 | `frontline-commander` | 4 | 1 | 4 | 4 |

### 行動型 × 安定型

| No. | タイプ名 | ID | thinkingAction | offensiveStable | soloTeam | divergentConvergent |
|-----|----------|-----|----------------|-----------------|----------|---------------------|
| 13 | 孤高のクラフター | `lone-crafter` | 4 | 4 | 1 | 1 |
| 14 | 完遂クローザー | `closer` | 4 | 4 | 1 | 4 |
| 15 | チーム調律師 | `team-conductor` | 4 | 4 | 4 | 1 |
| 16 | 最後の砦 | `last-fortress` | 4 | 4 | 4 | 4 |

---

## 5. 個体値バッジ方針

### EPIC / LEGENDARY バッジの設計思想

- **タイプそのものに格付けを付けない**（COMMON / RARE 等の常時表示は行わない）
- **EPIC / LEGENDARY は能力値条件達成時の特別バッジ**として扱う
- 例：特定の能力値が閾値（例: 80以上）を超えた場合にバッジが出現

### 理由

タイプ格付け（例：「これはSSRタイプです」）を設けると：
- タイプの優劣を感じさせる
- 「低レアリティ」タイプの結果がネガティブに受け取られる
- シェアの動機が「自慢」に偏りブランドイメージが毀損される

能力値条件バッジなら：
- 「このタイプで○○が高い人だけのバッジ」という個体値の文脈で機能する
- タイプはフラットに扱いつつ、特定条件を満たした人だけの希少性を演出できる

### 暫定バッジ条件案（仕様確定前）

| バッジ | 条件案 |
|--------|--------|
| EPIC | 任意の能力値が80以上 |
| LEGENDARY | 任意の能力値が90以上 かつ 全能力値が40以上 |

※ 条件は質問設計完了後に調整予定

---

## 6. キャラ画像方針

- 16タイプ全員分の画像を用意する前提（イラスト or AI生成）
- 配置先: `/public/images/characters/business-skills/{typeId}.png`
- types.json の `characterImage` フィールドに格納
- 現時点では未生成。フィールドのみ確保済み

### キャラクターコンセプト

各タイプに `characterConcept` フィールドでイラスト依頼用コンセプト文を記録済み。
実際のイラスト制作フェーズで参照すること。

---

## 7. 結果画面の方向性

### コンセプト

**RPGキャラクターステータス画面風。ただし高級感を最優先。**

- 「社会人ジョブカード」または「キャラクター・ドシエ」のイメージ
- 安っぽいガチャ演出・派手なアニメーションは避ける
- モノトーン基調＋各タイプのアクセントカラーで差別化

### 結果画面に表示する要素（将来版）

| 要素 | 備考 |
|------|------|
| タイプ名 | 日本語名 + englishName |
| キャラ画像 | characterImage |
| キャッチコピー | catchCopy |
| 個体値バッジ | EPIC / LEGENDARY（条件達成時のみ） |
| 5角形レーダーチャート | 5能力値 (Recharts製) |
| 4スタイル軸表示 | 4段階ドット表示 |
| 強み | strengths |
| 弱み | weaknesses |
| 致命的な弱点 | fatalWeakness |
| 壊れる環境 | badEnvironments |
| 向いている仕事 | recommendedRoles |
| 相性タイプ | compatibleTypes |
| 辛辣コメント | sarcasticComments |
| シェアボタン | X（旧Twitter）共有 |

### 現行MVP版（5問・4タイプ）との差分

現行ページが表示中の要素：
- タイプ名・summary・detail → catchCopy・shortDescription に移行予定
- スコアバー（CSS） → Recharts レーダーチャートに置き換え予定
- 辛辣コメント → 現行のまま（内容を更新）

---

## 8. types.json のフィールド設計

### 必須フィールド（後方互換性のため維持）

| フィールド | 型 | 用途 |
|------------|-----|------|
| `id` | string | タイプID（URLに使用） |
| `name` | string | 日本語タイプ名 |
| `character.color` | string | アクセントカラー（HEX）→ ResultClient で使用 |
| `representativeScores` | object | 代表的な能力値スコア（URLパラメータなし時のフォールバック） |
| `summary` | string | 短い説明（現行結果ページの `type.summary` に対応） |
| `detail` | string | 詳細説明（現行結果ページの `type.detail` に対応） |
| `strengths` | string[] | 強み一覧 |
| `weaknesses` | string[] | 弱み一覧 |
| `compatibleTypes` | string[] | 相性の良いタイプID |
| `recommendedRoles` | string[] | 向いている職種 |
| `sarcasticComments` | string[] | 辛辣コメント（2〜3個） |

### 新規フィールド（将来の結果画面向け）

| フィールド | 型 | 用途 |
|------------|-----|------|
| `englishName` | string | 英語タイプ名 |
| `axes` | object | 4スタイル軸の値（1〜4の整数） |
| `catchCopy` | string | 一言キャッチコピー |
| `shortDescription` | string | 2〜3行の説明文（将来 summary を置き換え） |
| `fatalWeakness` | string | 致命的な弱点（一言） |
| `badEnvironments` | string[] | 壊れる環境 |
| `characterConcept` | string | イラスト依頼用コンセプト文 |
| `characterImage` | string | キャラ画像パス（未生成の場合は空文字） |
| `accentColorKey` | string | カラーキー名（"indigo" など） |

---

## 9. scoring.json の現状と今後

### 現在（MVP プレースホルダー）

- method: `dominant-axis`（5能力値の最高軸でタイプ判定）
- 5能力値軸でおおまかに11タイプに到達可能
- 残り5タイプ（strategy-commander, structure-hacker, fortress-guardian, producer, lone-crafter）は直接URLアクセスのみ

### 今後（20問版）

- 4スタイル軸（thinkingAction / offensiveStable / soloTeam / divergentConvergent）を直接スコアリング
- 各質問が4軸のいずれかを測定する設計
- ScoringSchema の `method` を拡張または新設
- 20問完成後に scoring.json を完全再設計予定

---

## 10. 今後の作業リスト

| 優先度 | タスク |
|--------|--------|
| 高 | 20問の質問設計（4スタイル軸を測定する設問） |
| 高 | scoring.json の4軸対応（20問完成後） |
| 高 | Recharts レーダーチャート実装 |
| 高 | 4スタイル軸表示UIの実装 |
| 中 | 16タイプ分のコピーライティング完成版 |
| 中 | キャラクターイラスト16体の生成 |
| 中 | EPIC / LEGENDARY バッジ条件確定と実装 |
| 中 | OGP画像生成（タイプ別） |
| 低 | シェアボタン実装 |
| 低 | アフィリエイトリンク設計 |
