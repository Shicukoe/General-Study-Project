import { CHART } from "../constants";
import { buildArrowLines, bezierCP, arrowHead } from "../utils";

/**
 * SVG overlay rendered absolutely over the recharts ScatterChart.
 * Reads pre-captured pixel positions from dotPositions and renders bezier
 * arrows with forward (and optionally reverse) arrowheads.
 */
export default function ArrowOverlay({ scatterData, dotPositions, matrixMode }) {
  if (Object.keys(dotPositions).length === 0) return null;

  const lines = buildArrowLines(scatterData, dotPositions, matrixMode);
  const aLen  = 9;
  const aWid  = 4;

  return (
    <svg
      style={{
        position: "absolute", top: 0, left: 0,
        width: CHART.W, height: CHART.H,
        pointerEvents: "none",
      }}
    >
      {lines.map((l) => {
        const { cpx, cpy } = bezierCP(l.x1, l.y1, l.x2, l.y2, l.curve);
        const angleEnd     = Math.atan2(l.y2 - cpy, l.x2 - cpx);
        const angleStart   = Math.atan2(l.y1 - cpy, l.x1 - cpx);

        // Pull endpoints back so arrowheads sit exactly on dot edges
        const ex2 = l.x2 - aLen * Math.cos(angleEnd)   * 0.8;
        const ey2 = l.y2 - aLen * Math.sin(angleEnd)   * 0.8;
        const ex1 = l.twoWay ? l.x1 - aLen * Math.cos(angleStart) * 0.8 : l.x1;
        const ey1 = l.twoWay ? l.y1 - aLen * Math.sin(angleStart) * 0.8 : l.y1;
        const { cpx: cp2, cpy: cp2y } = bezierCP(ex1, ey1, ex2, ey2, l.curve);

        return (
          <g key={l.key}>
            <path
              d={`M ${ex1} ${ey1} Q ${cp2} ${cp2y} ${ex2} ${ey2}`}
              stroke={l.color} strokeWidth={1.5} fill="none"
            />
            {/* Forward arrowhead */}
            <polygon points={arrowHead(l.x2, l.y2, angleEnd, aLen, aWid)} fill={l.color} />
            {/* Reverse arrowhead (two-way only) */}
            {l.twoWay && (
              <polygon points={arrowHead(l.x1, l.y1, angleStart, aLen, aWid)} fill={l.color} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
