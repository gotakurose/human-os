// Pure SVG pentagon radar chart for 5-ability scores.
// Accepts V_k values (0–100 each); no side effects, no hooks.

import type { AbilityVScores } from "@/engine/ability-scorer";

interface Props {
  scores: AbilityVScores;
}

const N = 5;
const CX = 160;
const CY = 140;
const R  = 82;

const AXES: { key: keyof AbilityVScores; labelJp: string }[] = [
  { key: "logic",      labelJp: "論理力" },
  { key: "execution",  labelJp: "実行力" },
  { key: "sales",      labelJp: "営業力" },
  { key: "creativity", labelJp: "創造力" },
  { key: "management", labelJp: "管理力" },
];

function axisAngle(i: number): number {
  return -Math.PI / 2 + (i * 2 * Math.PI) / N;
}

function pt(r: number, i: number): [number, number] {
  const a = axisAngle(i);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function polyPoints(radii: number[]): string {
  return radii.map((r, i) => pt(r, i).join(",")).join(" ");
}

// Anchor text relative to each axis position
const TEXT_ANCHOR = ["middle", "start", "start", "end", "end"] as const;
// Vertical alignment nudge (positive = down) for each label
const LABEL_DY = [-4, 4, 4, 4, 4] as const;

export function PentagonRadarChart({ scores }: Props) {
  const gridRadii = [R * 1 / 3, R * 2 / 3, R];
  const dataRadii = AXES.map(({ key }) => R * scores[key] / 100);

  const GOLD        = "#9A7C46";
  const GOLD_FILL   = "rgba(154,124,70,0.18)";
  const GOLD_GRID   = "rgba(154,124,70,0.30)";
  const LABEL_COLOR = "#21160D";
  const SCORE_COLOR = "#6F552C";
  const AXIS_COLOR  = "rgba(154,124,70,0.22)";

  return (
    <svg
      viewBox="0 0 320 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: "100%", maxWidth: "340px", display: "block", margin: "0 auto" }}
    >
      {/* Grid rings */}
      {gridRadii.map((gr, gi) => (
        <polygon
          key={gi}
          points={polyPoints(AXES.map(() => gr))}
          fill="none"
          stroke={GOLD_GRID}
          strokeWidth="1"
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((_, i) => {
        const [x, y] = pt(R, i);
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={x}  y2={y}
            stroke={AXIS_COLOR}
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polyPoints(dataRadii)}
        fill={GOLD_FILL}
        stroke={GOLD}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {AXES.map(({ key }, i) => {
        const r = dataRadii[i];
        const [x, y] = pt(r, i);
        return (
          <circle key={key} cx={x} cy={y} r="3.5" fill={GOLD} />
        );
      })}

      {/* Labels and scores */}
      {AXES.map(({ key, labelJp }, i) => {
        const a       = axisAngle(i);
        const labelR  = R + 27;
        const scoreR  = R + 13;
        const lx      = CX + labelR * Math.cos(a);
        const ly      = CY + labelR * Math.sin(a);
        const sx      = CX + scoreR * Math.cos(a);
        const sy      = CY + scoreR * Math.sin(a);
        const anchor  = TEXT_ANCHOR[i];
        const dy      = LABEL_DY[i];

        return (
          <g key={key}>
            {/* Ability name */}
            <text
              x={lx} y={ly + dy}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="serif"
              fill={LABEL_COLOR}
              style={{ fontWeight: 600, letterSpacing: "0.04em" }}
            >
              {labelJp}
            </text>
            {/* V_k score */}
            <text
              x={sx} y={sy}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="9"
              fontFamily="monospace"
              fill={SCORE_COLOR}
            >
              {scores[key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
