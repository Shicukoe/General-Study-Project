import { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip,
  PieChart, Pie, Cell, Legend, Sector,
} from "recharts";
import {
  INDICATOR_ORDER,
  DIM_GROUPS,
  PAPER_INDICATOR_WEIGHTS,
  PAPER_DIMENSION_WEIGHTS,
} from "../constants";

const PIE_COLORS = ["#1e88e5", "#43a047", "#8e24aa", "#00acc1"];
const HIGHLIGHT_COLOR = "#2563eb";
const DIMENSION_ORDER = DIM_GROUPS.map(({ dim }) => dim);
const DIMENSION_COLOR_MAP = Object.fromEntries(
  DIMENSION_ORDER.map((dimension, idx) => [dimension, PIE_COLORS[idx % PIE_COLORS.length]])
);

const SHARED_AXIS_PROPS = {
  gridType: "polygon",
  stroke: "#555",
  strokeWidth: 1,
  polarRadius: [25, 50, 75, 100, 125, 150, 175, 200],
};

const RADAR_AXIS_LABEL_STYLE = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 10,
  fill: "#334155",
};

const RADAR_RADIUS_TICK_STYLE = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 10,
  fill: "#64748b",
};

const RADAR_SECTION_TITLE_STYLE = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 6,
  textAlign: "left",
};

const RADAR_HELPER_TEXT_STYLE = {
  fontSize: 11,
  color: "#64748b",
  fontFamily: "Inter, system-ui, sans-serif",
  marginTop: 4,
  textAlign: "center",
};

const PIE_TOOLTIP_CONTENT_STYLE = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 12,
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
};

function toDisplayLabel(rawLabel) {
  return rawLabel
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildDisplayToRawMap(rows = []) {
  return Object.fromEntries(rows.map((d) => [d.indicator.toLowerCase(), d.rawLabel]));
}

function extractRawLabelFromEvent(e, displayToRawMap) {
  const payloadRaw = e?.activePayload?.[0]?.payload?.rawLabel;
  if (payloadRaw) return payloadRaw;

  const payloadIndicator = e?.activePayload?.[0]?.payload?.indicator;
  if (payloadIndicator) {
    const mapped = displayToRawMap[payloadIndicator.toLowerCase()];
    if (mapped) return mapped;
  }

  const activeLabel = e?.activeLabel;
  if (activeLabel) {
    const mapped = displayToRawMap[String(activeLabel).toLowerCase()];
    if (mapped) return mapped;
  }

  return null;
}

function orderDimensionWeights(rows = []) {
  const rowMap = new Map(rows.map((row) => [row.dimension, row.weight]));

  return DIMENSION_ORDER.map((dimension) => ({
    dimension,
    weight: parseFloat(((rowMap.get(dimension) ?? 0)).toFixed(4)),
  }));
}

function renderRaisedPieSlice(props) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy + 10}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        fillOpacity={0.25}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
    </g>
  );
}

function RadarSection({
  title,
  data,
  selectedLabel,
  onMouseMove,
  onMouseLeave,
  onClick,
  radarName,
  stroke,
  fillOpacity,
  dot,
  tooltipContent,
  helperText,
  isAnimationActive = true,
}) {
  return (
    <div style={{ opacity: selectedLabel ? 0.92 : 1, transition: "opacity 0.18s ease" }}>
      <p style={RADAR_SECTION_TITLE_STYLE}>{title}</p>
      <RadarChart
        width={560}
        height={450}
        data={data}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        style={{ cursor: "pointer" }}
      >
        <PolarGrid {...SHARED_AXIS_PROPS} />
        <PolarAngleAxis dataKey="indicator" tick={RADAR_AXIS_LABEL_STYLE} />
        <PolarRadiusAxis
          tick={RADAR_RADIUS_TICK_STYLE}
          domain={[0, 0.4]}
          tickCount={9}
          tickFormatter={(v) => v.toFixed(2)}
        />
        <Radar
          name={radarName}
          dataKey="weight"
          stroke={stroke}
          fill={stroke}
          fillOpacity={fillOpacity}
          isAnimationActive={isAnimationActive}
          dot={dot}
          onClick={onClick}
          strokeWidth={2.5}
        />
        <Tooltip content={tooltipContent} />
      </RadarChart>
      <p style={RADAR_HELPER_TEXT_STYLE}>{helperText}</p>
    </div>
  );
}

function DimensionPieDrillDownCard({
  title,
  selectedLabel,
  selectedDimension,
  data,
  onClose,
  footerNote,
  keyPrefix,
}) {
  const orderedData = orderDimensionWeights(data);
  const activeIndex = orderedData.findIndex((entry) => entry.dimension === selectedDimension);
  const selectedDimensionColor = selectedDimension
    ? (DIMENSION_COLOR_MAP[selectedDimension] ?? HIGHLIGHT_COLOR)
    : HIGHLIGHT_COLOR;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        padding: "16px 20px",
        textAlign: "left",
        width: 420,
        alignSelf: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        animation: "radarDrillDownFade 180ms ease-out",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h3 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {title}
          </h3>
          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
            Selected: <em>{selectedLabel}</em>
            {selectedDimension && (
              <span style={{ marginLeft: 6, color: selectedDimensionColor, fontWeight: 600, fontStyle: "normal" }}>
                [{selectedDimension}]
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            fontSize: 12,
            cursor: "pointer",
            background: "transparent",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            padding: "3px 10px",
            color: "#64748b",
            fontFamily: "'Inter', system-ui, sans-serif",
            flexShrink: 0,
          }}
        >
          × Close
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
        <PieChart width={390} height={280}>
          <Tooltip formatter={(v) => v.toFixed(4)} contentStyle={PIE_TOOLTIP_CONTENT_STYLE} />
          <Pie
            data={orderedData}
            dataKey="weight"
            nameKey="dimension"
            cx="50%"
            cy="48%"
            outerRadius={95}
            innerRadius={50}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            activeIndex={activeIndex >= 0 ? activeIndex : undefined}
            activeShape={selectedDimension ? renderRaisedPieSlice : undefined}
          >
            {orderedData.map((entry, idx) => (
              <Cell
                key={`${keyPrefix}-cell-${idx}`}
                fill={DIMENSION_COLOR_MAP[entry.dimension] ?? PIE_COLORS[idx % PIE_COLORS.length]}
                fillOpacity={
                  !selectedDimension
                    ? 0.9
                    : entry.dimension === selectedDimension
                      ? 1
                      : 0.28
                }
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 11 }}
          />
        </PieChart>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "#64748b",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          marginTop: 4,
        }}
      >
      </p>
    </div>
  );
}

/** Returns the dimension name for a given indicator label (case-insensitive). */
function getDimensionForIndicator(rawLabel) {
  const normalized = (rawLabel ?? "").toLowerCase();
  return DIM_GROUPS.find((g) =>
    g.indicators.some((ind) => ind.toLowerCase() === normalized)
  )?.dim ?? null;
}

/**
 * Build reference radar from the paper's Table 11 extreme supermatrix weights,
 * sorted by INDICATOR_ORDER to match the user's radar axis layout.
 */
function buildPaperReferenceRadar() {
  const weightMap = Object.fromEntries(
    PAPER_INDICATOR_WEIGHTS.map((r) => [r.indicator.toLowerCase(), r.weight])
  );
  return INDICATOR_ORDER.map((label) => ({
    rawLabel: label,
    indicator: toDisplayLabel(label),
    weight: weightMap[label.toLowerCase()] ?? 0,
  }));
}

/**
 * Figure 3: Radar analysis diagram.
 * - Data point labels show exact DANP weight values.
 * - Click a point to trigger a Dimension Bar Chart drill-down with the
 *   clicked indicator's dimension highlighted.
 * - Side-by-side Expert Benchmark radar (8x8 mode only).
 */
export default function RadarAnalysis({ result, matrixMode, result4x4 }) {
  const [clickedLabel, setClickedLabel] = useState(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const [clickedPaperLabel, setClickedPaperLabel] = useState(null);
  const [hoveredPaperLabel, setHoveredPaperLabel] = useState(null);

  if (!result?.ranking) return null;

  const decimals = matrixMode === "4x4" ? 3 : 4;
  const radarData = [...result.ranking]
    .sort((a, b) => INDICATOR_ORDER.indexOf(a[0]) - INDICATOR_ORDER.indexOf(b[0]))
    .map(([rawLabel, weight]) => ({
      indicator: toDisplayLabel(rawLabel),
      rawLabel,
      weight: parseFloat(weight.toFixed(decimals)),
    }));

  const displayToRawMap = buildDisplayToRawMap(radarData);

  const paperRefData = matrixMode === "8x8" ? buildPaperReferenceRadar() : null;
  const paperDisplayToRawMap = buildDisplayToRawMap(paperRefData ?? []);

  // ── Dimension chart data (computed on first click) ───────────────────────
  let dimensionWeights = null;
  if (clickedLabel) {
    if (result4x4?.ranking) {
      dimensionWeights = DIM_GROUPS.map(({ dim }) => {
        const item = result4x4.ranking.find(([l]) => l === dim);
        return { dimension: dim, weight: item ? parseFloat(item[1].toFixed(4)) : 0 };
      });
    } else {
      const rankMap = Object.fromEntries(result.ranking.map(([l, w]) => [l, w]));
      dimensionWeights = DIM_GROUPS.map(({ dim, indicators }) => ({
        dimension: dim,
        weight: parseFloat(
          indicators.reduce((sum, ind) => sum + (rankMap[ind] ?? 0), 0).toFixed(4)
        ),
      }));
    }

    dimensionWeights = orderDimensionWeights(dimensionWeights);
  }

  const paperDimensionWeights = orderDimensionWeights(
    PAPER_DIMENSION_WEIGHTS.map((row) => ({
      dimension: row.dimension,
      weight: parseFloat(row.weight.toFixed(4)),
    }))
  );

  const clickedDim = clickedLabel ? getDimensionForIndicator(clickedLabel) : null;
  const clickedPaperDim = clickedPaperLabel ? getDimensionForIndicator(clickedPaperLabel) : null;

  const tooltipCardStyle = {
    backgroundColor: "#fff",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontSize: 12,
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const renderUserRadarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;

    return (
      <div style={tooltipCardStyle}>
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{d.indicator}</div>
        <div style={{ color: "#64748b" }}>
          Weight: <strong style={{ color: "#0f172a" }}>{Number(d.weight).toFixed(decimals)}</strong>
        </div>
      </div>
    );
  };

  const renderPaperRadarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;

    return (
      <div style={tooltipCardStyle}>
        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{d.indicator}</div>
        <div style={{ color: "#64748b" }}>
          Weight: <strong style={{ color: "#0f172a" }}>{Number(d.weight).toFixed(4)}</strong>
        </div>
      </div>
    );
  };

  // ── Custom dot: purely visual — active state highlight + weight label ──
  const renderDot = (dotProps) => {
    const { cx, cy, payload } = dotProps;
    if (cx == null || cy == null) return null;
    const hasSelection = Boolean(clickedLabel);
    const isActive = payload.rawLabel === clickedLabel;

    return (
      <g style={{ pointerEvents: "none" }}>
        {isActive && (
          <circle cx={cx} cy={cy} r={13} fill="#fed7aa" fillOpacity={0.65} />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? 8 : 6}
          fill={isActive ? "#e65100" : hasSelection ? "#93c5fd" : "#1e88e5"}
          stroke={isActive ? "#bf360c" : hasSelection ? "#60a5fa" : "#0d5ba8"}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize={8}
          fill="#334155"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {payload.weight.toFixed(decimals)}
        </text>
      </g>
    );
  };

  // ── Expert benchmark dot: shows fixed 4-decimal value labels ───────────
  const renderPaperDot = (dotProps) => {
    const { cx, cy, payload } = dotProps;
    if (cx == null || cy == null) return null;

    const hasSelection = Boolean(clickedPaperLabel);
    const isActive = payload.rawLabel === clickedPaperLabel;

    return (
      <g style={{ pointerEvents: "none" }}>
        {isActive && (
          <circle cx={cx} cy={cy} r={12} fill="#fed7aa" fillOpacity={0.6} />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isActive ? 8 : 5}
          fill={isActive ? "#e65100" : hasSelection ? "#fdba74" : "#e65100"}
          stroke={isActive ? "#bf360c" : hasSelection ? "#f59e0b" : "#bf360c"}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fontSize={8}
          fill="#334155"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {payload.weight.toFixed(4)}
        </text>
      </g>
    );
  };

  // Keep last hovered point as a fallback for click events with empty payload.
  const handleRadarMouseMove = (e) => {
    const raw = extractRawLabelFromEvent(e, displayToRawMap);
    if (raw) setHoveredLabel(raw);
  };

  // ── Radar click handler — robust fallback across recharts event shapes ──
  const handleRadarClick = (e) => {
    const raw = extractRawLabelFromEvent(e, displayToRawMap) ?? hoveredLabel;
    if (!raw) return;
    setClickedLabel((prev) => (prev === raw ? null : raw));
  };

  const handlePaperRadarMouseMove = (e) => {
    const raw = extractRawLabelFromEvent(e, paperDisplayToRawMap);
    if (raw) setHoveredPaperLabel(raw);
  };

  const handlePaperRadarClick = (e) => {
    const raw = extractRawLabelFromEvent(e, paperDisplayToRawMap) ?? hoveredPaperLabel;
    if (!raw) return;
    setClickedPaperLabel((prev) => (prev === raw ? null : raw));
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
        padding: "24px",
        marginBottom: "20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>
        {`@keyframes radarDrillDownFade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }`}
      </style>

      <div style={{ marginBottom: "16px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "'Inter', system-ui, sans-serif",
            textAlign: "left",
          }}
        >
        Resource Allocation Profile
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
          Comparative analysis of resource priorities: Your Model vs. Industry Expert Benchmark. Click any data point to drill down into dimension weights.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginTop: "8px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <RadarSection
          title="User's Radar"
          data={radarData}
          selectedLabel={clickedLabel}
          onMouseMove={handleRadarMouseMove}
          onMouseLeave={() => setHoveredLabel(null)}
          onClick={handleRadarClick}
          radarName="Weight"
          stroke="#1e88e5"
          fillOpacity={0.3}
          dot={renderDot}
          tooltipContent={renderUserRadarTooltip}
          helperText="Click a data point to see dimension breakdown."
        />

        {clickedLabel && dimensionWeights && (
          <DimensionPieDrillDownCard
            title="Dimension Weights"
            selectedLabel={clickedLabel}
            selectedDimension={clickedDim}
            data={dimensionWeights}
            onClose={() => setClickedLabel(null)}
            footerNote={
              result4x4?.ranking
                ? "(from 4×4 dimension analysis)"
                : "(summed from 8×8 indicator weights)"
            }
            keyPrefix="user"
          />
        )}

        {paperRefData && (
          <RadarSection
            title="Expert Benchmark (Paper)"
            data={paperRefData}
            selectedLabel={clickedPaperLabel}
            onMouseMove={handlePaperRadarMouseMove}
            onMouseLeave={() => setHoveredPaperLabel(null)}
            onClick={handlePaperRadarClick}
            radarName="Expert Benchmark"
            stroke="#e65100"
            fillOpacity={0.25}
            dot={renderPaperDot}
            tooltipContent={renderPaperRadarTooltip}
            helperText="Click a data point to see expert weighted dimensions. Source: paper Table 11 extreme supermatrix final weights."
          />
        )}

        {paperRefData && clickedPaperLabel && (
          <DimensionPieDrillDownCard
            title="Expert Dimension Weights"
            selectedLabel={clickedPaperLabel}
            selectedDimension={clickedPaperDim}
            data={paperDimensionWeights}
            onClose={() => setClickedPaperLabel(null)}
            footerNote="(paper Table 10 weighted dimensions)"
            keyPrefix="paper"
          />
        )}
      </div>
    </div>
  );
}
