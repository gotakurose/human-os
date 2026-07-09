# Human OS｜ビジマル診断｜固定名称・IDマスター

> 文書状態：正本・実装済み
> 更新日：2026年7月10日
> 対象：Human OS / ビジマル診断

表示名、内部 ID、画像ファイル名、URLパラメータを一元管理する。
本文・質問文・動的文章・画面構造は別文書で管理し、この文書に重複して記載しない。

---

## 1. ブランド・診断名称

| 項目 | 値 |
|---|---|
| ブランド名 | Human OS |
| 診断名 | ビジマル診断 |
| 説明名称 | ビジネスアニマル診断 |
| 診断対象 | 仕事における思考・行動・判断・役割傾向 |
| diagnosisId | `business-skills` |

---

## 2. 16タイプ対応表

| No. | typeId | 日本語タイプ名 | 英語表示名 | 動物タイプ | 基準コード | キャラクター画像 |
|---:|---|---|---|---|---|---|
| 01 | `vision-architect` | 事業構想家 | Vision Architect | ワシミミズクタイプ | `TOIE` | `vision-architect.png` |
| 02 | `win-hunter` | 勝ち筋ハンター | Winning Strategist | ハヤブサタイプ | `TOIF` | `winning-strategist.png` |
| 03 | `strategy-commander` | 企画軍師 | Strategy Mastermind | キツネタイプ | `TOGE` | `strategy-mastermind.png` |
| 04 | `siege-advisor` | 攻城参謀 | Breakthrough Tactician | オオカミタイプ | `TOGF` | `breakthrough-tactician.png` |
| 05 | `solo-inventor` | 独創の発明家 | Original Inventor | アライグマタイプ | `TSIE` | `original-inventor.png` |
| 06 | `precision-sniper` | 精密スナイパー | Insight Sniper | 黒猫タイプ | `TSIF` | `insight-sniper.png` |
| 07 | `structure-hacker` | 構造ハッカー | Structure Hacker | ワタリガラスタイプ | `TSGE` | `structure-hacker.png` |
| 08 | `fortress-guardian` | 城塞の守護者 | Castle Guardian | サイタイプ | `TSGF` | `castle-guardian.png` |
| 09 | `assault-creator` | 突撃クリエイター | Vanguard Creator | イノシシタイプ | `AOIE` | `vanguard-creator.png` |
| 10 | `sales-monster` | 営業モンスター | Sales Beast | トラタイプ | `AOIF` | `sales-beast.png` |
| 11 | `producer` | 巻き込みプロデューサー | Momentum Igniter | ボーダーコリータイプ | `AOGE` | `momentum-igniter.png` |
| 12 | `frontline-commander` | 前線指揮官 | Frontline Commander | ライオンタイプ | `AOGF` | `frontline-commander.png` |
| 13 | `lone-crafter` | 孤高のクラフター | Master Crafter | ビーバータイプ | `ASIE` | `master-crafter.png` |
| 14 | `closer` | 完遂クローザー | Final Closer | ワニタイプ | `ASIF` | `final-closer.png` |
| 15 | `team-conductor` | ギルド調律師 | Guild Harmonizer | 雄鹿タイプ | `ASGE` | `guild-harmonizer.png` |
| 16 | `last-fortress` | 最後の砦 | The Last Stand | バイソンタイプ | `ASGF` | `the-last-stand.png` |

### 基準4文字コードの読み方

| 位置 | 意味 | T/A | O/S | I/G | E/F |
|---|---|---|---|---|---|
| 1文字目 | thinking_action | T=Think | A=Act | ─ | ─ |
| 2文字目 | offensive_stable | ─ | ─ | O=Offense | S=Stability |
| 3文字目 | solo_team | ─ | ─ | I=Individual | G=Group |
| 4文字目 | divergent_convergent | ─ | ─ | E=Expand | F=Focus |

typeId と英語表示名は別物であり、一致していなくても変更しない（例：`win-hunter` / `Winning Strategist`）。

---

## 3. 4軸名称

| 内部キー | URL | 正方向（文字） | 日本語 | 負方向（文字） | 日本語 |
|---|---|---|---|---|---|
| `thinking_action` | `ta` | T / Think | 思考型 | A / Act | 行動型 |
| `offensive_stable` | `os` | O / Offense | 攻め型 | S / Stability | 安定型 |
| `solo_team` | `st` | I / Individual | 個人突破型 | G / Group | 組織推進型 |
| `divergent_convergent` | `dc` | E / Expand | 発散型 | F / Focus | 収束型 |

---

## 4. 族バッジ

| 内部キー | 表示名 | 画像 |
|---|---|---|
| Think | 思考族 | `think.png` |
| Act | 行動族 | `act.png` |
| Offense | 攻め族 | `offense.png` |
| Stability | 安定族 | `stability.png` |
| Individual | 個人突破族 | `individual.png` |
| Group | 組織推進族 | `group.png` |
| Expand | 発散族 | `expand.png` |
| Focus | 収束族 | `focus.png` |

---

## 5. 特化個体バッジ

| 内部キー | 表示名 | 画像 |
|---|---|---|
| `logic` | 論理特化個体 | `logic-specialist.png` |
| `execution` | 実行特化個体 | `execution-specialist.png` |
| `sales` | 営業特化個体 | `sales-specialist.png` |
| `creativity` | 創造特化個体 | `creative-specialist.png` |
| `management` | 管理特化個体 | `management-specialist.png` |

---

## 6. 5能力値

| 内部キー | 表示名 | 寄与質問数 n_k |
|---|---|---:|
| `logic` | 論理力 | 12 |
| `execution` | 実行力 | 8 |
| `sales` | 営業力 | 4 |
| `creativity` | 創造力 | 7 |
| `management` | 管理力 | 5 |

5能力値 URL パラメータ：`av`
形式：`1.{logicU}.{executionU}.{salesU}.{creativityU}.{managementU}`

---

## 7. 画像保存先

| 種別 | 保存先 |
|---|---|
| キャラクター画像 | `public/images/diagnoses/business-skills/characters/` |
| 族バッジ | `public/images/diagnoses/business-skills/badges/tribes/` |
| 特化個体バッジ | `public/images/diagnoses/business-skills/badges/specialists/` |
| ヒーロー画像 | `public/images/diagnoses/business-skills/` |
| 装飾・テクスチャ | `public/images/diagnoses/business-skills/ornaments/` / `textures/` |

---

## 8. 変更禁止

明示的な再決定なしに以下を変更しない。

- typeId
- 日本語タイプ名
- 英語表示名
- 動物タイプ
- キャラクター画像名
- 4軸の内部キー
- 4軸の URL パラメータ
- 4文字コード
- 5能力値の内部キー
- 5能力値の表示名
- 族バッジ名称
- 特化個体名称
- 画像保存先
- 16タイプと基準4文字コードの対応
