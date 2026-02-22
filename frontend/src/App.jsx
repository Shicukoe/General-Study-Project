import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMENSIONS_4X4 = [
  "Tangible assets",
  "Intangible assets",
  "Personal ability",
  "Organizational ability",
];

const DIMENSIONS_8X8 = [
  "Physical resources",
  "Financial resources",
  "Brand/business reputation resources",
  "Technical resources",
  "Relationship resources",
  "Marketing resources",
  "Human resources",
  "Organizational resources",
];

const EXAMPLE_4X4 = {
  mode: "4x4",
  labels: DIMENSIONS_4X4,
  matrix: [
    [0,   3.5, 2,   2  ],
    [3.4, 0,   3.4, 3.4],
    [2,   4,   0,   3  ],
    [3.5, 3.5, 2,   0  ],
  ],
};

const EXAMPLE_8X8 = {
  mode: "8x8",
  labels: DIMENSIONS_8X8,
  matrix: [
    [0, 1, 3, 4, 3, 3, 2, 4],
    [4, 0, 4, 1, 1, 4, 4, 4],
    [1, 4, 0, 0, 4, 4, 4, 4],
    [3, 2, 4, 0, 4, 2, 1, 4],
    [4, 1, 4, 3, 0, 2, 4, 1],
    [4, 4, 3, 4, 3, 0, 1, 4],
    [1, 4, 4, 4, 2, 4, 0, 3],
    [4, 4, 3, 4, 0, 4, 4, 0],
  ],
};

/** Indicator → dimension mapping used in Table 11. */
const DIM_GROUPS = [
  { dim: "Tangible assets",        indicators: ["Physical resources"] },
  { dim: "Intangible assets",      indicators: ["Financial resources", "Brand/business reputation resources", "Technical resources", "Relationship resources", "Marketing resources"] },
  { dim: "Personal ability",       indicators: ["Human resources"] },
  { dim: "Organizational ability", indicators: ["Organizational resources"] },
];

/** Canonical indicator order for Table 11 columns and Figure 3 radar axis. */
const INDICATOR_ORDER = DIM_GROUPS.flatMap((g) => g.indicators);

/** ScatterChart canvas dimensions and margins. */
const CHART = { W: 670, H: 450, ML: 20, MT: 20, MR: 20, MB: 40 };

// ─── Exact arrow pairs for Figure 2 (8×8) ───────────────────────────────────

/** 7 black one-way arrows from paper Figure 2 with per-arc curve offsets (px). */
const BLACK_PAIRS_8X8 = [
  { from: "Relationship resources",              to: "Brand/business reputation resources", curve: 130  },
  { from: "Technical resources",                 to: "Brand/business reputation resources", curve: 500  },
  { from: "Human resources",                     to: "Technical resources",                  curve: 50   },
  { from: "Financial resources",                 to: "Physical resources",                   curve: -40  },
  { from: "Financial resources",                 to: "Marketing resources",                  curve: 40   },
  { from: "Organizational resources",            to: "Technical resources",                  curve: -50  },
  { from: "Physical resources",                  to: "Brand/business reputation resources",  curve: 140  },
];

/** 11 red two-way arrows from paper Figure 2 with per-arc curve offsets (px). */
const RED_PAIRS_8X8 = [
  // Inner cluster — 3 causes × 2 non-sink effects
  { from: "Human resources",                     to: "Physical resources",               curve:   15 },
  { from: "Human resources",                     to: "Organizational resources",          curve: -150 },
  { from: "Financial resources",                 to: "Physical resources",               curve:    0 },
  { from: "Financial resources",                 to: "Organizational resources",          curve: -100 },
  { from: "Marketing resources",                 to: "Physical resources",               curve:  -15 },
  { from: "Marketing resources",                 to: "Organizational resources",          curve:  -10 },
  // Brand (sink) ↔ causes — large sweeping curves
  { from: "Brand/business reputation resources", to: "Human resources",                  curve: -180 },
  { from: "Brand/business reputation resources", to: "Financial resources",              curve: -140 },
  { from: "Brand/business reputation resources", to: "Marketing resources",              curve:  200 },
  // Brand (sink) ↔ non-sink effects
  { from: "Brand/business reputation resources", to: "Physical resources",               curve: -220 },
  { from: "Brand/business reputation resources", to: "Organizational resources",          curve:  200 },
];

// ─── Pure Utility Functions ───────────────────────────────────────────────────

/**
 * Returns a white → deep-orange color based on value/maxVal ratio.
 * Used for the total-influence matrix heatmap.
 */
function getHeatmapColor(val, maxVal) {
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
function bezierCP(x1, y1, x2, y2, offset) {
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
function arrowHead(tipX, tipY, angle, aLen, aWid) {
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
function buildArrowLines(scatterData, dotPositions, matrixMode) {
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Mode toggle (4×4 / 8×8) and Reset button bar. */
function ModeSelector({ matrixMode, onModeChange, onReset }) {
  const btnStyle = {
    padding: "8px 16px", cursor: "pointer",
    border: "1px solid #000", fontFamily: "Times New Roman", fontSize: 14,
  };
  return (
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <button onClick={() => onModeChange("4x4")} className={matrixMode === "4x4" ? "active" : ""}>
        4×4 Dimensions
      </button>
      <button onClick={() => onModeChange("8x8")} className={matrixMode === "8x8" ? "active" : ""}>
        8×8 Indicators
      </button>
      <button onClick={onReset} style={{ ...btnStyle, marginLeft: "20px" }}>
        Reset
      </button>
    </div>
  );
}

/** JSON paste area with Load Example and Import buttons. */
function JsonImportPanel({ jsonInput, onChange, onLoadExample, onImport }) {
  const btnStyle = {
    padding: "8px 16px", cursor: "pointer",
    border: "1px solid #000", fontFamily: "Times New Roman", fontSize: 14,
  };
  return (
    <div style={{ border: "1px solid #000", padding: "15px", marginBottom: "20px" }}>
      <h2>Import from JSON (Optional)</h2>
      <textarea
        value={jsonInput}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste JSON or load an example from the buttons below..."
        style={{
          width: "100%", height: "150px",
          fontFamily: "monospace", fontSize: 11,
          padding: "8px", border: "1px solid #ccc",
        }}
      />
      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <button onClick={() => onLoadExample(EXAMPLE_4X4)} style={{ ...btnStyle, marginRight: "10px" }}>
          Load Example 4×4
        </button>
        <button onClick={() => onLoadExample(EXAMPLE_8X8)} style={{ ...btnStyle, marginRight: "10px" }}>
          Load Example 8×8
        </button>
        <button onClick={onImport} style={{ ...btnStyle, backgroundColor: "#f0f0f0" }}>
          Import from JSON
        </button>
      </div>
    </div>
  );
}

/** Editable direct-influence matrix table with Analyze button. */
function MatrixInputTable({ labels, matrix, onChange, onAnalyze, loading }) {
  return (
    <div style={{ border: "1px solid #000", padding: "15px", marginBottom: "20px" }}>
      <h2>Direct Influence Matrix (Input)</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th></th>
              {labels.map((label, j) => <th key={j}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: "bold" }}>{labels[i]}</td>
                {row.map((val, j) => (
                  <td key={j} style={{ backgroundColor: i === j ? "#f5f5f5" : "white" }}>
                    {i === j ? (
                      <span style={{ color: "#999" }}>0</span>
                    ) : (
                      <input
                        type="number" min="0" max="4" step="1" value={val}
                        onChange={(e) => onChange(i, j, e.target.value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button onClick={onAnalyze} disabled={loading}>
          {loading ? "Processing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

/** Heatmap-colored simplified total-influence matrix (Table 2 / Table 3). */
function TotalInfluenceTable({ labels, result, matrixMode }) {
  const simplified = result.simplified_total_influence_matrix ?? result.total_influence_matrix;
  const maxVal     = Math.max(...result.total_influence_matrix.flat());
  const decimals   = matrixMode === "4x4" ? 3 : 4;
  const tableNum   = matrixMode === "4x4" ? "2" : "3";
  const subject    = matrixMode === "4x4" ? "dimensions" : "indicators";

  return (
    <div style={{ border: "1px solid #000", padding: "15px", marginBottom: "20px" }}>
      <h2>Table {tableNum}: List of simplified total influence-relation matrices of the {subject}.</h2>

      {/* Heatmap legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: 12, fontFamily: "Times New Roman" }}>
        <span>Low</span>
        <div style={{ width: 160, height: 14, background: "linear-gradient(to right, #ffffff, #e65100)", border: "1px solid #ccc" }} />
        <span>High influence</span>
        <span style={{ marginLeft: 20, color: "#888" }}>(α = mean(T); cells below α zeroed)</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th></th>
              {labels.map((label, j) => <th key={j}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {simplified.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: "bold" }}>{labels[i]}</td>
                {row.map((val, j) => (
                  <td
                    key={j}
                    style={{
                      backgroundColor: getHeatmapColor(val, maxVal),
                      color: val === 0 ? "#bbb" : "#000",
                      textAlign: "center", padding: "4px 8px",
                    }}
                  >
                    {val.toFixed(decimals)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** D / R / D+R / D−R summary table with Cause/Effect role column. */
function ProminenceRelationTable({ labels, result, matrixMode }) {
  return (
    <div style={{ border: "1px solid #000", padding: "15px", marginBottom: "20px" }}>
      <h2>Prominence and Relation Summary ({matrixMode === "4x4" ? "Dimensions" : "Indicators"})</h2>
      <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px 0" }}>
        D = row sum of T (influence given) &nbsp;|&nbsp;
        R = column sum of T (influence received) &nbsp;|&nbsp;
        D+R = Prominence (overall impact) &nbsp;|&nbsp;
        D−R = Relation &gt; 0 → Cause, &lt; 0 → Effect
      </p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>D</th>
              <th>R</th>
              <th>D+R (Prominence)</th>
              <th>D−R (Relation)</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => {
              const d_i       = result.d ? result.d[i] : (result.prominence[i] + result.relation[i]) / 2;
              const r_i       = result.r ? result.r[i] : (result.prominence[i] - result.relation[i]) / 2;
              const isCause   = result.relation[i] > 0;
              const roleColor = isCause ? "#d32f2f" : "#1e88e5";
              return (
                <tr key={i}>
                  <td style={{ fontWeight: "bold" }}>{label}</td>
                  <td>{d_i.toFixed(4)}</td>
                  <td>{r_i.toFixed(4)}</td>
                  <td>{result.prominence[i].toFixed(4)}</td>
                  <td style={{ color: roleColor }}>{result.relation[i].toFixed(4)}</td>
                  <td style={{ fontWeight: "bold", color: roleColor }}>
                    {isCause ? "Cause" : "Effect"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * SVG overlay rendered absolutely over the recharts ScatterChart.
 * Reads pre-captured pixel positions from dotPositions and renders bezier
 * arrows with forward (and optionally reverse) arrowheads.
 */
function ArrowOverlay({ scatterData, dotPositions, matrixMode }) {
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

/**
 * Cause-and-effect scatter diagram (Figure 1 / Figure 2) with SVG arrow overlay.
 * Exact dot pixel positions are captured from recharts through the shape callback
 * and stored in dotPositionsRef / dotPositions for use by ArrowOverlay.
 */
function CauseEffectDiagram({ scatterData, matrixMode, dotPositionsRef, dotPositions, setDotPositions }) {
  const xValues  = scatterData.map((d) => d.prominence);
  const yValues  = scatterData.map((d) => d.relation);
  const xDomMin  = Math.floor((Math.min(...xValues) - 0.5) * 10) / 10;
  const xDomMax  = Math.ceil( (Math.max(...xValues) + 0.5) * 10) / 10;
  const yDomMin  = Math.floor((Math.min(...yValues) - 0.2) * 10) / 10;
  const yDomMax  = Math.ceil( (Math.max(...yValues) + 0.2) * 10) / 10;

  const figNum     = matrixMode === "4x4" ? "1" : "2";
  const figSubject = matrixMode === "4x4" ? "Dimension" : "Indicator";

  return (
    <div style={{ border: "1px solid #000", padding: "15px", marginBottom: "20px" }}>
      <h2>
        Figure {figNum}: {figSubject} cause-and-effect graph for the core resources
        and impact indicators of the affiliated restaurants' development
      </h2>
      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto", marginTop: "15px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>

          <ScatterChart
            width={CHART.W} height={CHART.H}
            margin={{ top: CHART.MT, right: CHART.MR, left: CHART.ML, bottom: CHART.MB }}
            style={{ userSelect: "none" }}
          >
            <CartesianGrid stroke="#ddd" strokeDasharray="3 3" />
            <XAxis
              type="number" dataKey="prominence" name="d+r"
              label={{ value: "d+r", position: "insideBottomRight", offset: -5, style: { fontFamily: "Times New Roman", fontSize: 12 } }}
              domain={[xDomMin, xDomMax]}
              tick={{ fontFamily: "Times New Roman", fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              type="number" dataKey="relation" name="d-r"
              label={{ value: "d-r", angle: -90, position: "insideLeft", style: { fontFamily: "Times New Roman", fontSize: 12 } }}
              domain={[yDomMin, yDomMax]}
              tick={{ fontFamily: "Times New Roman", fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{ backgroundColor: "#fff", padding: "8px", border: "1px solid #000", fontFamily: "Times New Roman", fontSize: 11 }}>
                    <div style={{ fontWeight: "bold" }}>{d.name}</div>
                    <div>{d.prominence.toFixed(4)}, {d.relation.toFixed(4)}</div>
                    <div style={{ color: d.fill }}>{d.type}</div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            <Scatter
              data={scatterData}
              shape={(props) => {
                const { cx, cy, payload } = props;
                if (!payload || cx == null || cy == null) return null;

                // Capture exact recharts pixel position for the arrow overlay
                const prev = dotPositionsRef.current[payload.name];
                if (!prev || prev.cx !== cx || prev.cy !== cy) {
                  dotPositionsRef.current[payload.name] = { cx, cy };
                  setTimeout(() => setDotPositions({ ...dotPositionsRef.current }), 0);
                }

                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5} fill={payload.fill} stroke="#000" strokeWidth={1} />
                    <text x={cx + 8} y={cy - 8} fill={payload.fill} fontSize={10} fontFamily="Times New Roman">
                      {payload.name} {payload.type}
                    </text>
                    <text x={cx + 8} y={cy + 3} fill="#000" fontSize={9} fontFamily="Times New Roman">
                      {payload.prominence.toFixed(4)}, {payload.relation.toFixed(4)}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>

          <ArrowOverlay
            scatterData={scatterData}
            dotPositions={dotPositions}
            matrixMode={matrixMode}
          />
        </div>
      </div>
    </div>
  );
}

/** Table 11: indicator extreme supermatrix weight table with dimension rowspan grouping. */
function WeightRankingTable({ result }) {
  if (!result?.ranking) return null;

  const priorityMap = {};
  result.ranking.forEach((item, idx) => { priorityMap[item[0]] = idx + 1; });

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Dimensions</th>
            <th>Evaluation indicators</th>
            {INDICATOR_ORDER.map((col) => <th key={col}>{col}</th>)}
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {DIM_GROUPS.flatMap(({ dim, indicators }) =>
            indicators.map((indicator, rowIdx) => {
              const rankingItem = result.ranking.find((item) => item[0] === indicator);
              if (!rankingItem) return null;
              const weight = rankingItem[1].toFixed(4);
              return (
                <tr key={indicator}>
                  {rowIdx === 0 && (
                    <td
                      rowSpan={indicators.length}
                      style={{ fontWeight: "bold", verticalAlign: "middle", borderRight: "1px solid #ccc" }}
                    >
                      {dim}
                    </td>
                  )}
                  <td style={{ textAlign: "left", paddingLeft: "8px" }}>{indicator}</td>
                  {INDICATOR_ORDER.map((col) => (
                    <td
                      key={col}
                      style={{
                        backgroundColor: col === indicator ? "#fff8e1" : "inherit",
                        fontWeight: col === indicator ? "bold" : "normal",
                      }}
                    >
                      {weight}
                    </td>
                  ))}
                  <td style={{ fontWeight: "bold" }}>{priorityMap[indicator]}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Figure 3: Radar chart of indicator weights sorted by canonical INDICATOR_ORDER. */
function RadarAnalysis({ result, matrixMode }) {
  if (!result?.ranking) return null;

  const decimals  = matrixMode === "4x4" ? 3 : 4;
  const radarData = [...result.ranking]
    .sort((a, b) => INDICATOR_ORDER.indexOf(a[0]) - INDICATOR_ORDER.indexOf(b[0]))
    .map((item) => ({
      indicator: item[0].split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      weight: parseFloat(item[1].toFixed(decimals)),
    }));

  return (
    <div style={{ marginTop: "20px", textAlign: "center" }}>
      <h2>Figure 3: Radar analysis diagram of the core resources and impact indicators for the development of affiliated restaurants.</h2>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "15px" }}>
        <RadarChart width={700} height={500} data={radarData}>
          <PolarGrid
            gridType="polygon"
            stroke="#555" strokeWidth={1}
            polarRadius={[25, 50, 75, 100, 125, 150, 175, 200]}
          />
          <PolarAngleAxis
            dataKey="indicator"
            tick={{ fontFamily: "Times New Roman", fontSize: 11, fill: "#000" }}
          />
          <PolarRadiusAxis
            tick={{ fontFamily: "Times New Roman", fontSize: 10, fill: "#000" }}
            domain={[0, 0.4]} tickCount={9}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Radar
            name="Weight" dataKey="weight"
            stroke="#1e88e5" fill="#1e88e5" fillOpacity={0.3}
            isAnimationActive={true}
            dot={{ fill: "#1e88e5", r: 5, strokeWidth: 1.5, stroke: "#0d5ba8" }}
            strokeWidth={2.5}
          />
          <Tooltip
            formatter={(v) => v.toFixed(decimals)}
            contentStyle={{ fontFamily: "Times New Roman", fontSize: 12, border: "1px solid #000", borderRadius: "0px" }}
            labelStyle={{ fontFamily: "Times New Roman", fontSize: 12 }}
          />
        </RadarChart>
      </div>
    </div>
  );
}

// ─── Main App Component ───────────────────────────────────────────────────────

function App() {
  // Separate matrix / result state per mode so switching modes preserves data
  const [matrixMode, setMatrixMode] = useState("4x4");
  const [matrix4x4,  setMatrix4x4]  = useState(() => Array(4).fill(null).map(() => Array(4).fill(0)));
  const [matrix8x8,  setMatrix8x8]  = useState(() => Array(8).fill(null).map(() => Array(8).fill(0)));
  const [result4x4,  setResult4x4]  = useState(null);
  const [result8x8,  setResult8x8]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [jsonInput,  setJsonInput]  = useState("");

  // Exact dot pixel positions captured from recharts shape callback
  const dotPositionsRef = useRef({});
  const [dotPositions, setDotPositions] = useState({});

  // ── Derived values for the currently active mode ──────────────────────────
  const labels    = matrixMode === "4x4" ? DIMENSIONS_4X4 : DIMENSIONS_8X8;
  const matrix    = matrixMode === "4x4" ? matrix4x4 : matrix8x8;
  const setMatrix = matrixMode === "4x4" ? setMatrix4x4 : setMatrix8x8;
  const result    = matrixMode === "4x4" ? result4x4 : result8x8;
  const setResult = matrixMode === "4x4" ? setResult4x4 : setResult8x8;

  // Clear stale dot positions whenever the result changes (new layout expected).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    dotPositionsRef.current = {};
    setDotPositions({});
  }, [result]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleReset = () => {
    if (matrixMode === "4x4") {
      setMatrix4x4(Array(4).fill(null).map(() => Array(4).fill(0)));
      setResult4x4(null);
    } else {
      setMatrix8x8(Array(8).fill(null).map(() => Array(8).fill(0)));
      setResult8x8(null);
    }
  };

  const handleCellChange = (i, j, value) => {
    const updated = matrix.map((row) => [...row]);
    updated[i][j] = parseFloat(value) || 0;
    setMatrix(updated);
  };

  const handleLoadExample = (exampleData) => {
    setJsonInput(JSON.stringify(exampleData, null, 2));
  };

  const handleImportJSON = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!data.matrix || !data.labels || !data.mode) {
        alert("JSON must contain: mode, labels, and matrix");
        return;
      }
      if (data.matrix.length !== data.labels.length) {
        alert("Matrix size must match number of labels");
        return;
      }
      if (data.mode !== matrixMode) setMatrixMode(data.mode);
      if (data.mode === "4x4") { setMatrix4x4(data.matrix); setResult4x4(null); }
      else if (data.mode === "8x8") { setMatrix8x8(data.matrix); setResult8x8(null); }
      alert("Data imported successfully!");
      setJsonInput("");
    } catch (err) {
      alert("Invalid JSON: " + err.message);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await axios.post(`${apiUrl}/analyze`, { matrix, labels });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail ?? "Backend connection error. Make sure FastAPI is running.");
    }
    setLoading(false);
  };

  // ── Scatter data derived from current analysis result ─────────────────────

  const scatterData = result
    ? labels.map((label, i) => ({
        name:       label,
        prominence: parseFloat(result.prominence[i].toFixed(4)),
        relation:   parseFloat(result.relation[i].toFixed(4)),
        type:       result.relation[i] > 0 ? "Cause" : "Effect",
        fill:       result.relation[i] > 0 ? "#d32f2f" : "#1e88e5",
      }))
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>DEMATEL + DANP Decision Support System</h1>

      <ModeSelector matrixMode={matrixMode} onModeChange={setMatrixMode} onReset={handleReset} />

      <JsonImportPanel
        jsonInput={jsonInput}
        onChange={setJsonInput}
        onLoadExample={handleLoadExample}
        onImport={handleImportJSON}
      />

      <MatrixInputTable
        labels={labels}
        matrix={matrix}
        onChange={handleCellChange}
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {result && (
        <>
          <TotalInfluenceTable labels={labels} result={result} matrixMode={matrixMode} />
          <ProminenceRelationTable labels={labels} result={result} matrixMode={matrixMode} />
          <CauseEffectDiagram
            scatterData={scatterData}
            matrixMode={matrixMode}
            dotPositionsRef={dotPositionsRef}
            dotPositions={dotPositions}
            setDotPositions={setDotPositions}
          />

          {matrixMode === "8x8" && (
            <div style={{ border: "1px solid #000", padding: "15px", marginTop: "20px" }}>
              <h2>Table 11: List for indicator extreme supermatrices.</h2>
              <WeightRankingTable result={result} />
              <RadarAnalysis result={result} matrixMode={matrixMode} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
