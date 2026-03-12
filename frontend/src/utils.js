import { BLACK_PAIRS_8X8, RED_PAIRS_8X8 } from "./constants";

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/**
 * Returns a white → deep-orange color based on value/maxVal ratio.
 * Used for the total-influence matrix heatmap.
 */
export function getHeatmapColor(val, maxVal) {
  if (val === 0 || maxVal === 0) return "#ffffff";
  const ratio = val / maxVal;
  const g = Math.round(255 - ratio * (255 - 81));
  const b = Math.round(255 - ratio * 255);
  return `rgb(255,${g},${b})`;
}

/**
 * Computes the quadratic bezier control point via a perpendicular offset at the
 * midpoint of the line from (x1,y1) to (x2,y2).
 * @param {number} offset - positive curves "right" of the from→to direction.
 */
export function bezierCP(x1, y1, x2, y2, offset) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { cpx: mx + (-dy / len) * offset, cpy: my + (dx / len) * offset };
}

/**
 * Builds the SVG polygon `points` string for an arrowhead tip at (tipX, tipY)
 * pointing along `angle` radians.
 */
export function arrowHead(tipX, tipY, angle, aLen, aWid) {
  const p1x = tipX - aLen * Math.cos(angle) + aWid * Math.sin(angle);
  const p1y = tipY - aLen * Math.sin(angle) - aWid * Math.cos(angle);
  const p2x = tipX - aLen * Math.cos(angle) - aWid * Math.sin(angle);
  const p2y = tipY - aLen * Math.sin(angle) + aWid * Math.cos(angle);
  return `${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`;
}

/**
 * Builds the complete list of arrow line descriptors for the cause-effect diagram.
 *
 * For 8×8: uses the hardcoded paper-exact pairs (BLACK_PAIRS_8X8, RED_PAIRS_8X8).
 * For 4×4: uses a generic algorithm (cause chain + sink + red two-way).
 *
 * @param {Array}  scatterData  - [{ name, prominence, relation, type }, ...]
 * @param {Object} dotPositions - { [name]: { cx, cy } } pixel positions from recharts
 * @param {string} matrixMode   - "4x4" | "8x8"
 * @returns {Array} lines - [{ x1, y1, x2, y2, color, twoWay, curve, key }, ...]
 */
export function buildArrowLines(scatterData, dotPositions, matrixMode) {
  const DOT_OFFSET = 7; // px clearance from dot centre
  const curveScale = matrixMode === "8x8" ? 0.3 : 0;

  const lines = [];
  const byName = (name) => scatterData.find((d) => d.name === name);

  const addLine = (from, to, color, twoWay, curve = 0) => {
    const p1 = dotPositions[from.name];
    const p2 = dotPositions[to.name];
    if (!p1 || !p2) return;
    const dx = p2.cx - p1.cx;
    const dy = p2.cy - p1.cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    lines.push({
      x1: p1.cx + (dx / len) * DOT_OFFSET,
      y1: p1.cy + (dy / len) * DOT_OFFSET,
      x2: p2.cx - (dx / len) * DOT_OFFSET,
      y2: p2.cy - (dy / len) * DOT_OFFSET,
      color, twoWay, curve,
      key: `arr-${from.name}-${to.name}`,
    });
  };

  if (matrixMode === "8x8") {
    // ── Figure 2: hardcoded 7 black + 11 red pairs from paper ─────────────
    BLACK_PAIRS_8X8.forEach(({ from, to, curve }) => {
      const f = byName(from), t = byName(to);
      if (f && t) addLine(f, t, "#000000", false, curve * curveScale);
    });
    RED_PAIRS_8X8.forEach(({ from, to, curve }) => {
      const f = byName(from), t = byName(to);
      if (f && t) addLine(f, t, "#d32f2f", true, curve * curveScale);
    });
  } else {
    // ── Figure 1: generic 4×4 algorithm ───────────────────────────────────
    // Sort causes descending by relation; effects ascending (most-negative = sink)
    const causes = [...scatterData.filter((d) => d.type === "Cause")]
      .sort((a, b) => b.relation - a.relation);
    const effects = [...scatterData.filter((d) => d.type === "Effect")]
      .sort((a, b) => a.relation - b.relation);

    // Black: cause chain (descending relation) then lowest-cause → sink-effect
    for (let i = 0; i < causes.length - 1; i++) {
      addLine(causes[i], causes[i + 1], "#000000", false, 0);
    }
    if (causes.length > 0 && effects.length > 0) {
      addLine(causes[causes.length - 1], effects[0], "#000000", false, 0);
    }

    // Red two-way: all causes ↔ non-sink effects; sink ↔ non-sink effects
    for (let ei = 1; ei < effects.length; ei++) {
      causes.forEach((cause) => addLine(cause, effects[ei], "#d32f2f", true, 0));
    }
    for (let ei = 1; ei < effects.length; ei++) {
      addLine(effects[0], effects[ei], "#d32f2f", true, 0);
    }
  }

  return lines;
}
