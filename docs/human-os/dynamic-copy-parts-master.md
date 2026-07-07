Human OS / ビジマル診断
動的文章パーツマスター

【目的】

4軸、5能力値、特化個体、組み合わせによって
固定文章へ追加・置換する文章パーツを管理する。

【ルール】

・タイプ固定文章と混ぜない
・すべて一意のIDを付ける
・適用条件を必ず書く
・適用禁止タイプを指定できるようにする
・複数パーツが同時に出る場合の優先順位を持たせる
・単純連結で不自然になる文章は作らない
・同じ内容を複数セクションへ表示しない
・動的文章は、指定された固定スロットの置換または限定的な追記として使用する
・置換対象スロットを必ず指定する
・固定セクション本文は、明示的な全文置換仕様がない限り常に表示する
・append_paragraphに適用候補がない場合は、追加スロット自体を表示しない
・replace_slotに適用候補がない場合は、そのスロットに用意された固定基準文を表示する
・replace_slotによる置換時は、同じスロットの固定基準文と動的文章を同時表示しない



────────────────
 A｜4軸補正
 ────────────────
【目的】
4軸補正は、タイプそのものを変更するものではない。
同じタイプの中で、
・どの傾向が特に強く出ているか
 ・どの傾向は中央に近いか
 ・タイプ固定文章の特徴が、本人にはどの程度強く現れるか
を補足する。
タイプ固有の強み、弱み、破綻構造は固定本文を正本とし、
 4軸だけを理由に置き換えない。

【対象】
・Think
 ・Act
 ・Offense
 ・Stability
 ・Individual
 ・Group
 ・Expand
 ・Focus

【軸強度】
各軸の絶対値を、その軸の最大値で割って強度を算出する。
intensity = abs(axisScore) / axisMaxScore
axisMaxScoreは0より大きい有効値でなければならない。
axisMaxScoreが0、欠損、NaN、範囲外の場合は、
その結果に4軸動的文章を表示しない。
初期閾値：
・mild：0以上、0.30未満
・clear：0.30以上、0.65未満
・extreme：0.65以上
この数値は仮置きとする。
最終質問文v3と4軸採点の大量シミュレーション後、
出現率に大きな偏りがある場合のみ閾値を調整する。

【極性と比較尺度】
各軸の極性はaxisScoreの符号から決定する。
dominant axis、soft axis、族バッジの軸間比較には、
生のaxisScoreやその絶対値ではなく、
各軸で算出済みのintensityを使用する。
4軸間の最大値、最小値、同点判定は、
すべて同じintensityと共通ロジックによって行う。

【0点・同点・全軸0の確定仕様】

診断回答から新たに typeId を算出する場合、
各軸の極性は以下で判定する。

・axisScore が 0 以上：正極
・axisScore が 0 未満：負極

したがって、axisScore が 0 の場合は正極として扱う。

結果ページで、すでに確定している typeId と
4文字コードを整合させる場合は、以下で判定する。

・axisScore が 0 より大きい：正極
・axisScore が 0 より小さい：負極
・axisScore が 0：typeId の基準4文字コードの極性を使用する

0点時に、動的文章側で独自の極性を推測しない。

dominant axis と族バッジは、
同じ正規化済み intensity と同じ共通判定処理を使用する。

最大 intensity が複数軸で同点の場合は、
以下の優先順位で1軸へ解決する。

1. thinking_action（ta）
2. offensive_stable（os）
3. solo_team（st）
4. divergent_convergent（dc）

soft axis の単独最小判定にも、
同じ intensity と同点判定を使用する。
最小 intensity が複数軸で同点の場合、
soft axis は表示しない。

全4軸の axisScore が 0 の場合、
通常の診断算出結果は以下とする。

・typeId：vision-architect
・4文字コード：TOIE
・族バッジ：思考族
・4軸メーター：すべて中央
・balanced profile文章：表示する
・dominant axis文章：表示しない
・soft axis文章：表示しない

全4軸が mild の場合は、
balanced profile文章を最優先で1件だけ表示し、
dominant axis文章とsoft axis文章は表示しない。

ta、os、st、dcの欠損、空文字、NaN、Infinity、
範囲外、axisMaxScoreの不正、
またはtypeIdと算出4文字コードが不一致の場合は、
4軸動的文章を表示しない。

この場合もタイプ固定本文は通常どおり表示し、
動的文章の追加スロットだけを非表示とする。

【dominant axis】
4軸のうち、intensityが最も大きい軸。
・族バッジの判定軸と必ず一致させる
・族バッジと同じ共通helperおよび同点処理を使用する
・1結果につき1つだけ選ぶ
・dominant axisと軸強度を別々の文章として表示しない
・dominant axisのclear版またはextreme版を1つだけ表示する
最大intensityが同点の場合は、
族バッジと同じ共通ロジックで1軸へ解決する。
動的文章側で独自の同点優先順位を持たない。

【soft axis】
4軸のうち、intensityが最も小さい軸。
以下をすべて満たす場合のみ表示する。
・soft axisがmild
・soft axisのintensityが単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードと極性が一致する
・dominant axis文章が表示されている
・4軸すべてがmildではない
強度差は、以下の式で判定する。
dominantIntensity - softIntensity >= 0.25
dominantIntensityとsoftIntensityには、
各軸で算出済みのintensityを使用する。
clear / extremeの閾値との差ではなく、
dominant axisとsoft axisの強度同士を比較する。
最小intensityが同点の場合は、
soft axis文章を表示しない。

【balanced profile】
4軸すべてがmildの場合に使用する。
この場合は、
・balanced profile文章を1つだけ表示する
・dominant axis文章を表示しない
・soft axis文章を表示しない
・ここで4軸動的文章の選出処理を終了する

【選出フローと表示数】
4軸動的文章は、1結果につき最大2パーツとする。
選出は必ず以下の順番で行う。

1. 4軸すべてがmildか確認する

4軸すべてがmildの場合：
・balanced profile文章を1つだけ表示する
・dominant axis文章は表示しない
・soft axis文章は表示しない
・ここで選出処理を終了する

2. dominant axisを決定する

全軸mildではない場合：
・4軸のうち、intensityが最も大きい1軸だけをdominant axisとする
・族バッジに使用する軸と必ず一致させる
・dominant axisを複数選ばない
・その軸のintensityに応じてclear版またはextreme版のどちらか1つを表示する

最大intensityが同点の場合は、
族バッジと同じ共通ロジックを使用する。

動的文章側で独自の同点優先順位を持たない。

3. soft axisの表示可否を判定する

dominant axis文章を表示したうえで、
soft axisが定義済みの全条件を満たす場合のみ、
soft axis文章を2つ目のパーツとして1つ表示する。

soft axisは複数表示しない。

4軸V1で発生する表示構成は、以下の3種類だけとする。

・dominant axis文章 1件
・dominant axis文章 1件 ＋ soft axis文章 1件
・balanced profile文章 1件

同じセクションへ、
2つの4軸文章を表示しない。

【dominant Think / Act】
対象セクション：
thinking
置換対象スロット：
thinking.axisNote
表示方法：
固定の「仕事の思考回路」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・判断前に考える量
 ・行動開始までの速度
 ・考えてから動くか
 ・動きながら考えるか

【dominant Offense / Stability】
対象セクション：
career
置換対象スロット：
career.axisNote
表示方法：
固定の「キャリア適性」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・変化や獲得を求める環境
 ・継続性や再現性を重視する環境
 ・リスクの取り方
 ・力を発揮しやすい裁量や評価方法

【dominant Individual / Group】
対象セクション：
relationships
置換対象スロット：
relationships.axisNote
表示方法：
固定の「人間関係」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・一人で判断する範囲
 ・他者と認識をそろえる量
 ・信頼の置き方
 ・個人責任と集団責任の捉え方

【dominant Expand / Focus】
対象セクション：
thinking
置換対象スロット：
thinking.axisNote
表示方法：
固定の「仕事の思考回路」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・選択肢を広げる傾向
 ・一案へ絞る速度
 ・別の用途や展開を考える傾向
 ・完了条件と収束判断

【soft axis】
対象セクション：
overview
置換対象スロット：
overview.axisSoftNote
表示方法：
固定の「タイプ概要」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・タイプコード上はその極に属している
 ・ただし、その傾向は強く固定されていない
 ・状況によって反対側の行動も取りやすい
 ・「典型から外れる」ではなく「出方が穏やか」と表現する

【balanced profile】
対象セクション：
overview
置換対象スロット：
overview.axisBalanceNote
表示方法：
固定の「タイプ概要」の末尾へ、
 独立した1段落として限定追記する。
扱う内容：
・4軸全体の差が小さい
 ・タイプの中心傾向は存在する
 ・場面によって反対側の行動も選びやすい
 ・柔軟、万能、バランス型などの安い称賛はしない

【V1では使用しないセクション】
4軸単体では、以下を置換しない。
・辛辣コメント
 ・強み1〜3
 ・弱み1〜3
 ・致命的弱点
 ・成長ヒント1〜3
 ・向いている仕事
 ・避けたい仕事
 ・チームでの役割
 ・結論
これらはタイプ固有の因果や役割が強いため、
 汎用的な4軸文章へ置き換えると16タイプの差別化が弱くなる。
タイプ×軸、軸×能力値、最低能力など、
 より具体的な条件が確定した場合のみ置換対象とする。

【固定本文との接続ルール】
動的文章は、
各軸で指定されたセクションの固定本文末尾へ、
独立した1段落として追記する。

結果ページ全体の末尾へまとめて追加しない。

dominant axis文章：

・固定本文の特徴をさらに強める補足として書く
・固定本文と反対の人物像を追加しない
・最初の一文で、固定本文とのつながりが自然に分かるようにする

soft axis文章：

・固定本文を否定せず、その特徴の出方が比較的穏やかであることを書く
・反対側の能力が高い、得意、優秀であるとは断定しない
・「バランスが良い」「万能」「中和できている」などの安い称賛をしない
・最初の一文で、固定本文の典型傾向を緩和する補足だと分かるようにする

接続詞は、
「さらに」「特に」「一方で」「ただし」などから、
固定本文に合うものを文章ごとに選ぶ。

すべてのパーツで同じ接続詞を機械的に使い回さない。

制作後は、
対象となる8タイプすべての固定本文末尾へ実際に接続し、
矛盾、重複、文脈の断絶がないか確認する。

【ID形式】
dominant axis：
dynamic.axis.dominant.[pole].[strength].[section]
例：
dynamic.axis.dominant.think.clear.thinking
 dynamic.axis.dominant.focus.extreme.thinking
 dynamic.axis.dominant.group.clear.relationships
soft axis：
dynamic.axis.soft.[pole].mild.overview
例：
dynamic.axis.soft.act.mild.overview
 dynamic.axis.soft.group.mild.overview
balanced profile：
dynamic.axis.profile.balanced.overview
poleは以下で統一する。
・think
 ・act
 ・offense
 ・stability
 ・individual
 ・group
 ・expand
 ・focus

【データ項目】
各文章パーツは以下を持つ。
・id
 ・layer
 ・axisRole
 ・pole
 ・strength
 ・section
 ・targetSlot
 ・renderMode
 ・conditions
 ・targetTypes
 ・forbiddenTypes
 ・priority
 ・text
renderMode：
・append_paragraph
 ・replace_slot
4軸V1では、原則としてappend_paragraphのみ使用する。

【renderModeと固定本文の関係】

append_paragraph：

・固定セクション本文は常に表示する
・選出された動的文章を、指定された固定本文の末尾へ独立段落として追加する
・候補がない場合は追加スロット自体を表示しない
・固定セクション本文はpriority判定の対象に含めない

replace_slot：

・指定スロットに用意された固定基準文と動的文章を競合させる
・動的文章が選出された場合は、そのスロットの固定基準文を表示しない
・動的文章が選出されない場合は、そのスロットの固定基準文を表示する
・セクション全体の本文を置換するものではない

全文置換：

・明示的に全文置換と定義されたセクションだけで使用できる
・4軸動的文章V1では使用しない

【適用条件】

全パーツ共通：

・4軸すべての有効なスコアが存在する
・typeIdと算出された4文字コードの対応が正しい
・strengthが定義済みの範囲に入る
・同じスロットへ上位優先文章が適用されていない

dominant axis文章：

・対象poleが4文字コードに含まれる
・dominant axisが族バッジと一致する
・dominant axisの強度に対応するclear版またはextreme版が存在する

soft axis文章：

・対象poleが4文字コードに含まれる
・dominant axis文章が表示されている
・soft axisが個別パーツに記載された全条件を満たす

balanced profile文章：

・4軸すべてがmild
・dominant axis文章を表示しない
・soft axis文章を表示しない
・poleはnoneとし、4文字コードへのpole包含判定を行わない

各文章パーツに記載された個別条件も、
すべて満たした場合のみ表示する。

【動的文章を表示しない条件】

以下の場合は動的文章を表示しない。

・URLパラメータが欠損している
・値がNaN
・値が範囲外
・typeIdと4文字コードが一致しない
・族バッジとdominant axisが一致しない
・旧共有URLで軸強度を復元できない
・適用可能な文章が存在しない

上記に該当する場合も、
タイプ固定のセクション本文は通常どおり表示する。

append_paragraphの追加スロットだけを非表示とし、
固定セクション本文を削除、置換、空欄化してはいけない。


不正値を推測で補完して、動的文章を表示してはいけない。

【将来レイヤーとの表示上限】

「1結果につき最大2パーツ」は、
4軸動的文章V1レイヤー内だけの上限とする。

将来追加する以下の文章は、
この2パーツには含めない。

・5能力値文章
・特化個体文章
・軸×能力値の組み合わせ文章
・タイプ固有の組み合わせ文章

ただし、
同じスロットへ複数レイヤーの文章が該当した場合は、
D｜適用優先順位に従い、上位1件だけを表示する。

V2設計時に、
すべての動的文章を合計した結果ページ全体の表示上限を別途決定する。

【V1制作数】
dominant axis：
8極 × clear / extreme
 合計16パーツ
soft axis：
8極 × mild
 合計8パーツ
balanced profile：
1パーツ
合計：
25パーツ
制作後は、
 各文章を対象となる8タイプすべてへ当て込み、
 固定本文との重複、矛盾、不自然な連結を監査する。

────────────────
 A-1｜dominant axis文章
 ────────────────
【ID】
 dynamic.axis.dominant.think.clear.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 think
【strength】
 clear
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがthink
 ・strengthがclear
 ・族バッジがThink
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 strategy-commander
 siege-advisor
 solo-inventor
 precision-sniper
 structure-hacker
 fortress-guardian
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 加えて、あなたは動き出す前に、目的や前提、失敗した時の影響を一度整理する傾向がはっきりしています。情報が足りないまま手数を増やすより、判断の質を上げてから着手する方が、結果的に速いと考えます。ただし、動かなければ得られない情報まで事前に揃えようとすると、準備が着手条件へ変わります。

【ID】
 dynamic.axis.dominant.think.extreme.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 think
【strength】
 extreme
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがthink
 ・strengthがextreme
 ・族バッジがThink
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 strategy-commander
 siege-advisor
 solo-inventor
 precision-sniper
 structure-hacker
 fortress-guardian
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 特に、あなたにとって考えることは準備ではなく、仕事の主要工程です。周囲が十分だと判断する段階でも、前提の粗さや例外、後から戻れなくなる条件まで確認しなければ動きにくい傾向があります。その深さは重大な誤りを防ぐ一方、現実へ触れる時期を自分で決めなければ、思考の完成が行動の許可証になります。

【ID】
 dynamic.axis.dominant.act.clear.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 act
【strength】
 clear
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがact
 ・strengthがclear
 ・族バッジがAct
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 assault-creator
 sales-monster
 producer
 frontline-commander
 lone-crafter
 closer
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 また、あなたは考えを固め切ってから動くより、まず現実に触れ、返ってきた反応から次の判断を作る傾向がはっきりしています。小さく試せる状況では、議論を続けるより行動した方が早く正確な情報を得られます。ただし、動けば修正できる問題と、動く前に止めるべき問題を分けないと、初速の速さが後処理の量へ変わります。

【ID】
 dynamic.axis.dominant.act.extreme.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 act
【strength】
 extreme
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがact
 ・strengthがextreme
 ・族バッジがAct
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 assault-creator
 sales-monster
 producer
 frontline-commander
 lone-crafter
 closer
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
とりわけ、あなたは行動を始めるまでの距離が非常に短く、考えることと動くことをほぼ同時に進めます。接触、試作、交渉、現場確認など、状況に応じた最初の一手を早く打ち、返ってきた情報から方針を更新できるため、停滞した状況を一気に動かせます。一方で、後から修正できる判断と、信用、契約、安全のように事前確認が必要な判断を分けなければ、速さが取り返しのつかない先行判断へ変わります。

【ID】
 dynamic.axis.dominant.offense.clear.career
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 offense
【strength】
 clear
【section】
 career
【targetSlot】
 career.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがoffense
 ・strengthがclear
 ・族バッジがOffense
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 strategy-commander
 siege-advisor
 assault-creator
 sales-monster
 producer
 frontline-commander
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
加えて、あなたは現状を正確に守るだけでなく、まだ取れていない成果や改善余地へ自分から踏み込める環境で力が出ます。目標が明確で、提案や判断によって数字や状況を変えられるほど、集中力が高まります。ただし、獲得後の維持や再発防止まで評価に含まれないと、次の成果へ進むほど後工程が置き去りになりやすくなります。

【ID】
 dynamic.axis.dominant.offense.extreme.career
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 offense
【strength】
 extreme
【section】
 career
【targetSlot】
 career.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがoffense
 ・strengthがextreme
 ・族バッジがOffense
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 strategy-commander
 siege-advisor
 assault-creator
 sales-monster
 producer
 frontline-commander
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 特に、あなたは既存の成果を守る役割より、未獲得の市場、顧客、数字、変化を取りに行く責任を持つ時に最も強く動きます。難易度や競争が高くても、自分の判断で勝負の条件を変えられるなら、負荷そのものが推進力になります。ただし、前進している実感が弱い仕事を価値の低い仕事と見なすと、獲得した成果を残すための運用や整備が後回しになります。

【ID】
 dynamic.axis.dominant.stability.clear.career
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 stability
【strength】
 clear
【section】
 career
【targetSlot】
 career.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがstability
 ・strengthがclear
 ・族バッジがStability
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 solo-inventor
 precision-sniper
 structure-hacker
 fortress-guardian
 lone-crafter
 closer
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
また、あなたは一度の成果だけでなく、品質や信頼を崩さず、同じ水準を繰り返し出せる環境で強みが出ます。変化を拒むのではなく、影響を見極め、続けられる形へ整えてから広げることを重視します。ただし、維持する価値と、変えないことで失う機会の両方を評価できる環境が必要です。 

【ID】
 dynamic.axis.dominant.stability.extreme.career
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 stability
【strength】
 extreme
【section】
 career
【targetSlot】
 career.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがstability
 ・strengthがextreme
 ・族バッジがStability
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 solo-inventor
 precision-sniper
 structure-hacker
 fortress-guardian
 lone-crafter
 closer
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
とりわけ、あなたは成果が出た瞬間だけでなく、その成果が翌月も来年も崩れず続くかまで重く見ます。人の頑張りや偶然に依存する状態を放置せず、手順、品質、責任、復旧方法まで整えられる役割で真価が出ます。一方で、守る対象と理由を定期的に見直さなければ、過去に必要だった安定まで現在の制約として残し続けます。

【ID】
 dynamic.axis.dominant.individual.clear.relationships
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 individual
【strength】
 clear
【section】
 relationships
【targetSlot】
 relationships.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがindividual
 ・strengthがclear
 ・族バッジがIndividual
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 solo-inventor
 precision-sniper
 assault-creator
 sales-monster
 lone-crafter
 closer
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
加えて、あなたは親しさがあっても判断や責任の境界を保ち、必要以上に互いへ依存しない関係を好みます。頻繁な確認より、各自が自分の持ち場を引き受け、必要な時に正確な情報を返すことを信頼と捉えます。ただし、自分で処理できることを説明しないまま抱えると、相手には自立ではなく拒絶や無関心として伝わります。 

【ID】
 dynamic.axis.dominant.individual.extreme.relationships
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 individual
【strength】
 extreme
【section】
 relationships
【targetSlot】
 relationships.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがindividual
 ・strengthがextreme
 ・族バッジがIndividual
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 win-hunter
 solo-inventor
 precision-sniper
 assault-creator
 sales-monster
 lone-crafter
 closer
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
特に、あなたは他者と協力する場面でも、最終的な判断と責任を自分の内側へ置こうとします。広く相談して認識をそろえるより、自分で考え抜き、必要な相手へ必要な情報だけを共有するため、意思決定の独立性が高くなります。その自己完結性は判断の一貫性を高める一方、助けや説明を求める時期が遅れるほど、周囲には信頼されていない、関与を拒まれていると伝わりやすくなります。

【ID】
 dynamic.axis.dominant.group.clear.relationships
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 group
【strength】
 clear
【section】
 relationships
【targetSlot】
 relationships.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがgroup
 ・strengthがclear
 ・族バッジがGroup
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 strategy-commander
 siege-advisor
 structure-hacker
 fortress-guardian
 producer
 frontline-commander
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
そのうえで、あなたは個人の正しさだけでなく、相手がどう受け取り、全体がどう動くかまで含めて関係を考える傾向がはっきりしています。認識差や役割のずれを放置せず、必要な人同士をつなぐことで信頼を作ります。ただし、関係を維持するための調整を自分が引き受け続けると、周囲が直接向き合う責任まで肩代わりすることになります。 

【ID】
 dynamic.axis.dominant.group.extreme.relationships
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 group
【strength】
 extreme
【section】
 relationships
【targetSlot】
 relationships.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがgroup
 ・strengthがextreme
 ・族バッジがGroup
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 strategy-commander
 siege-advisor
 structure-hacker
 fortress-guardian
 producer
 frontline-commander
 team-conductor
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
とりわけ、あなたは自分一人が正しいことより、複数人が同じ目的を理解し、それぞれの役割から動ける状態を強く求めます。情報、責任、判断のつながりを整え、集団全体が機能する形を優先します。一方で、場の停滞や対立まで自分の責任として回収すると、他者が負うべき判断や摩擦まで抱え込みやすくなります。

【ID】
 dynamic.axis.dominant.expand.clear.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 expand
【strength】
 clear
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがexpand
 ・strengthがclear
 ・族バッジがExpand
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 strategy-commander
 solo-inventor
 structure-hacker
 assault-creator
 producer
 lone-crafter
 team-conductor
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 加えて、あなたは一つの答えへ早く固定するより、別の用途、組み合わせ、展開可能性を残しながら考える傾向がはっきりしています。新しい情報が入るほど、当初の案を超える選択肢を作れることが強みです。ただし、可能性を作る時間と今回採用する案を決める時間を分けなければ、改善のたびに完了条件が動きます。

【ID】
 dynamic.axis.dominant.expand.extreme.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 expand
【strength】
 extreme
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがexpand
 ・strengthがextreme
 ・族バッジがExpand
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 vision-architect
 strategy-commander
 solo-inventor
 structure-hacker
 assault-creator
 producer
 lone-crafter
 team-conductor
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 特に、あなたは一つの情報から複数の用途、市場、企画、協力関係を連鎖的に見つけます。現在の課題を解くだけでなく、その先に生まれる次の可能性まで同時に考えるため、構想や選択肢が急速に広がります。その広がりは新しい価値を生む一方、何を今回は捨て、どこで探索を終えるかを先に決めなければ、最も有望な案まで着地前に更新され続けます。

【ID】
 dynamic.axis.dominant.focus.clear.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 focus
【strength】
 clear
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがfocus
 ・strengthがclear
 ・族バッジがFocus
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 win-hunter
 siege-advisor
 precision-sniper
 fortress-guardian
 sales-monster
 frontline-commander
 closer
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 そのうえで、あなたは有力な方向が見えた後、選択肢を残し続けるより、今回進める一案へ資源と注意を集める傾向がはっきりしています。完了条件と優先順位を明確にし、不要な要素を減らすことで成果を現実へ着地させます。ただし、絞り込んだ後にも前提の変化を確認しなければ、集中力が別の可能性を見ない理由へ変わります。

【ID】
 dynamic.axis.dominant.focus.extreme.thinking
【layer】
 axis_v1
【axisRole】
 dominant
【pole】
 focus
【strength】
 extreme
【section】
 thinking
【targetSlot】
 thinking.axisNote
【renderMode】
 append_paragraph
【適用条件】
 ・dominant axisがfocus
 ・strengthがextreme
 ・族バッジがFocus
 ・4軸すべての有効値が存在する
 ・typeIdが対象タイプに含まれる
 ・同じスロットへ上位文章が適用されていない
【対象タイプ】
 win-hunter
 siege-advisor
 precision-sniper
 fortress-guardian
 sales-monster
 frontline-commander
 closer
 last-fortress
【適用禁止タイプ】
 なし
【priority】
 6
【文章】
 とりわけ、あなたは複数案を並行して育てるより、最も重要な一点を決め、他を切ってでもそこへ集中する時に強さが出ます。目的に不要な情報、工程、選択肢を落とし、何をもって終わりとするかを明確にするため、複雑な仕事を短い経路へ収束できます。一方で、一度定めた焦点が強いほど、途中で現れた別の可能性や前提変化を、集中を乱す情報として扱いやすくなります。
────────────────
A-2｜soft axis文章
────────────────

【ID】
dynamic.axis.soft.think.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
think

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがthink
・strengthがmild
・Think / Act軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにTが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
vision-architect
win-hunter
strategy-commander
siege-advisor
solo-inventor
precision-sniper
structure-hacker
fortress-guardian

【適用禁止タイプ】
なし

【priority】
7

【文章】
事前に考えてから動く傾向は、あなたの中で強く固定されているわけではありません。影響の大きい判断では前提や条件を整理しますが、後から修正できる場面では、現実へ触れながら考えを更新することもあります。考えることを重視する特徴は、すべての場面ではなく、判断の重さに応じて現れます。

【ID】
dynamic.axis.soft.act.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
act

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがact
・strengthがmild
・Think / Act軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにAが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
assault-creator
sales-monster
producer
frontline-commander
lone-crafter
closer
team-conductor
last-fortress

【適用禁止タイプ】
なし

【priority】
7

【文章】
まず動く傾向は、どの場面でも強く出るわけではありません。考え続けるだけでは状況が動かない時は早く一手を打ちますが、影響が大きく戻しにくい判断では、事前に条件を整理してから動きます。行動を重視する特徴は、常に先へ出ることではなく、動く必要がある場面で判断を止めない形で現れます。 

【ID】
dynamic.axis.soft.offense.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
offense

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがoffense
・strengthがmild
・Offense / Stability軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにOが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
vision-architect
win-hunter
strategy-commander
siege-advisor
assault-creator
sales-monster
producer
frontline-commander

【適用禁止タイプ】
なし

【priority】
7

【文章】
成果や変化を取りに行く傾向は、常に前進を最優先するほど強くありません。獲得する価値が明確な時は踏み込みますが、守るべき品質や関係への損失が大きい場合は、現状を維持する判断も取ります。攻める特徴は、勝負する意味が見える場面で穏やかに現れます。

【ID】
dynamic.axis.soft.stability.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
stability

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがstability
・strengthがmild
・Offense / Stability軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにSが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
solo-inventor
precision-sniper
structure-hacker
fortress-guardian
lone-crafter
closer
team-conductor
last-fortress

【適用禁止タイプ】
なし

【priority】
7

【文章】
継続性や安全性を重視する傾向は、変化を避け続けるほど強く固定されていません。守る理由が明確なものは維持しますが、現状が目的に合わなくなれば、変える判断も選びます。安定を求める特徴は、維持そのものではなく、変化の影響を確かめる形で現れます。

【ID】
dynamic.axis.soft.individual.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
individual

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがindividual
・strengthがmild
・Individual / Group軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにIが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
vision-architect
win-hunter
solo-inventor
precision-sniper
assault-creator
sales-monster
lone-crafter
closer

【適用禁止タイプ】
なし

【priority】
7

【文章】
自分で考え、自分で責任を持とうとする傾向は、すべてを一人で完結させるほど強くありません。自分で決めるべき範囲は保ちながらも、状況に応じて他者へ情報や判断を開きます。個人で進める特徴は、他者を避ける形ではなく、責任の境界を明確にする形で現れます。

【ID】
dynamic.axis.soft.group.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
group

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがgroup
・strengthがmild
・Individual / Group軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにGが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
strategy-commander
siege-advisor
structure-hacker
fortress-guardian
producer
frontline-commander
team-conductor
last-fortress

【適用禁止タイプ】
なし

【priority】
7

【文章】
周囲と認識をそろえ、全体が動く形を考える傾向は、常に集団判断を優先するほど強くありません。関係者の理解が必要な場面では共有を重視しますが、責任範囲が明確なら、自分で決めて進めることもあります。組織を意識する特徴は、全員の合意より、必要な接続を保つ形で現れます。

【ID】
dynamic.axis.soft.expand.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
expand

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがexpand
・strengthがmild
・Expand / Focus軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにEが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
vision-architect
strategy-commander
solo-inventor
structure-hacker
assault-creator
producer
lone-crafter
team-conductor

【適用禁止タイプ】
なし

【priority】
7

【文章】
選択肢や可能性を広げる傾向は、際限なく案を増やすほど強くありません。まだ条件が固まっていない段階では複数案を残しますが、目的と制約が見えれば、今回扱う範囲へ絞れます。発散する特徴は、常に広げ続けることではなく、必要な時に別案を残す形で現れます。

【ID】
dynamic.axis.soft.focus.mild.overview

【layer】
axis_v1

【axisRole】
soft

【pole】
focus

【strength】
mild

【section】
overview

【targetSlot】
overview.axisSoftNote

【renderMode】
append_paragraph

【適用条件】
・4軸すべてがmildではない
・soft axisがfocus
・strengthがmild
・Expand / Focus軸のintensityが最小で、単独最小
・dominant axisとの強度差が0.25以上
・typeIdの基準4文字コードにFが含まれる
・dominant axis文章が表示されている
・4軸すべての有効値が存在する
・typeIdが対象タイプに含まれる
・同じスロットへ上位文章が適用されていない

【対象タイプ】
win-hunter
siege-advisor
precision-sniper
fortress-guardian
sales-monster
frontline-commander
closer
last-fortress

【適用禁止タイプ】
なし

【priority】
7

【文章】
一案へ絞り、完了へ向かう傾向は、最初から他の可能性を閉じるほど強くありません。目的と条件が明確になれば集中しますが、前提が曖昧な段階では、別案や変更余地も残します。収束する特徴は、早く切り捨てることより、決めるべき時に範囲を定める形で現れます。

────────────────
A-3｜balanced profile文章
────────────────

【ID】
dynamic.axis.profile.balanced.overview

【layer】
axis_v1

【axisRole】
balanced

【pole】
none

【strength】
mild

【section】
overview

【targetSlot】
overview.axisBalanceNote

【renderMode】
append_paragraph

【適用条件】
・Think / Act軸がmild
・Offense / Stability軸がmild
・Individual / Group軸がmild
・Expand / Focus軸がmild
・4軸すべての有効値が存在する
・typeIdと基準4文字コードが一致する
・dominant axis文章を表示しない
・soft axis文章を表示しない
・同じスロットへ上位文章が適用されていない

【対象タイプ】
vision-architect
win-hunter
strategy-commander
siege-advisor
solo-inventor
precision-sniper
structure-hacker
fortress-guardian
assault-creator
sales-monster
producer
frontline-commander
lone-crafter
closer
team-conductor
last-fortress

【適用禁止タイプ】
なし

【priority】
8

【文章】
今回の結果では、4つの軸はいずれも中央に近く、タイプコードが示す傾向が、どの場面でも同じ強さで現れるわけではありません。目的、責任、相手、失敗した時の影響によって、反対側の判断も選びやすい状態です。そのため、周囲からは場面ごとに動き方が変わるように見えることがあります。必ずしも一貫性がないことを意味しませんが、本人の判断基準が共有されていないと、周囲には方針が読みにくく映ることがあります。



────────────────
B｜5能力値補正
────────────────

対象：
logic / execution / sales / creativity / management

状態：
・high
・low
・top
・bottom
・specialist

各パーツの形式：

【ID】
dynamic.ability.[ability].[state].[section]

【対象セクション】

【置換対象スロット】

【適用条件】

【適用禁止タイプ】

【優先順位】

【文章】


────────────────
C｜重要な組み合わせ
────────────────

例：

・Think高 × 実行力高
・Act高 × 管理力高
・Individual高 × 営業力高
・Group高 × 創造力高
・Expand高 × 管理力高
・Focus高 × 創造力高
・論理力高 × 営業力低
・創造力高 × 管理力低

各パーツの形式：

【ID】
dynamic.combo.[condition].[section]

【対象セクション】

【置換対象スロット】

【適用条件】

【対象タイプ】

【適用禁止タイプ】

【優先順位】

【文章】


────────────────
D｜適用優先順位
────────────────

priorityは、数値が小さいほど優先度が高い。

同じtargetSlotへ複数の動的文章が該当した場合は、
priorityが最も小さい候補1件だけを採用する。

priority：

1. タイプ固有の組み合わせ文章
2. 重要な軸×能力値の組み合わせ文章
3. 特化個体文章
4. 最低能力文章
5. タイプ固有の軸例外文章
6. dominant axis文章
7. soft axis文章
8. balanced profile文章

同じtargetSlotに、
同一の最小priorityを持つ候補が複数該当した場合は、
ランダム選択や配列順による選択を行わない。

この状態は設定エラーとして扱い、
そのスロットの動的文章を採用しない。

fallback：

・append_paragraphの場合
　固定セクション本文を表示し、動的追加スロットは表示しない

・replace_slotの場合
　そのスロットに用意された固定基準文を表示する

・全文置換の場合
　タイプ固定の全文を表示する

固定セクション本文そのものは、
明示的な全文置換仕様がない限り、
priorityによる競合候補に含めない。

同じ意味の動的文章を複数表示しない。

dominant axis文章と軸強度文章は、
別々の文章として扱わない。

dominant axisを決定した後、
clearまたはextremeのどちらか1つだけを選ぶ。

