# Human OS｜ビジマル診断｜正本反映QA

- 更新日：2026年7月17日
- 結論：PASS
- JSON・コード変更：なし

| 項目 | 実値 | 期待値 | 結果 |
|---|---:|---:|---|
| branch_rows | 163 | 163 | PASS |
| evidence_rows | 1514 | 1514 | PASS |
| subRouteId_unique | 163 | 163 | PASS |
| mainRouteId_unique | 65 | 65 | PASS |
| evidence_pair_duplicates | 0 | 0 | PASS |
| min_evidence_count | 3 | 3 | PASS |
| weight_min | 1.0 | 1.0 | PASS |
| weight_max | 1.45 | 1.45 | PASS |
| typeId_set_match | True | True | PASS |
| question_ids_valid | True | True | PASS |
| partner_names_valid | True | True | PASS |
| candidate_word_absent_in_md | True | True | PASS |

## ファイル責任

- 1,514証拠の全行：回答証拠マスターのみ
- 65主ルート・163サブルートの全行：結果分岐マスターのみ
- 判定式：質問・採点・判定仕様
- 結果構造・補正：結果文章・生成仕様
- ID形式：固定名称・IDマスター
- 進行状態：総合・運用マスター
- 合格条件：実装・QAチェックリスト
