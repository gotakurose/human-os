/**
 * 4軸スタイルスコアから相性タイプを機械的に導出する。
 * 手書きの compatibleTypes / conflictTypes を廃止するための算出ロジック。
 */

interface TypeWithAxes {
  id: string;
  axes?: {
    thinkingAction: number;
    offensiveStable: number;
    soloTeam: number;
    divergentConvergent: number;
  };
}

/**
 * 相性が良いタイプIDリストを返す。
 * 条件: offensive/stable が同じ AND solo/team が同じ AND (thinking/action OR divergent/convergent が異なる)
 */
export function computeCompatibleTypes(
  type: TypeWithAxes,
  allTypes: TypeWithAxes[]
): string[] {
  if (!type.axes) return [];
  const { thinkingAction: ta, offensiveStable: os, soloTeam: st, divergentConvergent: dc } =
    type.axes;

  return allTypes
    .filter((other) => {
      if (other.id === type.id || !other.axes) return false;
      const ota = other.axes.thinkingAction;
      const oos = other.axes.offensiveStable;
      const ost = other.axes.soloTeam;
      const odc = other.axes.divergentConvergent;
      return oos === os && ost === st && (ota !== ta || odc !== dc);
    })
    .map((other) => other.id);
}

/**
 * ぶつかりやすいタイプIDリストを返す。
 * 条件: thinking/action が同じ AND divergent/convergent が同じ AND (offensive/stable OR solo/team が異なる)
 */
export function computeConflictTypes(
  type: TypeWithAxes,
  allTypes: TypeWithAxes[]
): string[] {
  if (!type.axes) return [];
  const { thinkingAction: ta, offensiveStable: os, soloTeam: st, divergentConvergent: dc } =
    type.axes;

  return allTypes
    .filter((other) => {
      if (other.id === type.id || !other.axes) return false;
      const ota = other.axes.thinkingAction;
      const oos = other.axes.offensiveStable;
      const ost = other.axes.soloTeam;
      const odc = other.axes.divergentConvergent;
      return ota === ta && odc === dc && (oos !== os || ost !== st);
    })
    .map((other) => other.id);
}
