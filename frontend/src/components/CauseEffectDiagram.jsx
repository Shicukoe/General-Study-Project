import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea,
} from "recharts";
import { useState } from "react";
import { CHART } from "../constants";
import ArrowOverlay from "./ArrowOverlay";

// Quadrant definitions
const QUADRANT_STRATEGY = {
  "Core Engine": {
    quadrant: "I",
    accentColor: "#dc2626",
    fill: "#fef2f2",
    border: "#fca5a5",
    advice: "This is a Core Engine - highly central and actively causes other factors. Prioritize budget and management attention here for maximum system-wide impact.",
  },
  "Hidden Influencer": {
    quadrant: "II",
    accentColor: "#d97706",
    fill: "#fffbeb",
    border: "#fcd34d",
    advice: "This is a Hidden Influencer - a low-profile cause with significant ripple effects. Small improvements here can cascade across the whole system.",
  },
  "Isolated Factor": {
    quadrant: "III",
    accentColor: "#64748b",
    fill: "#f8fafc",
    border: "#cbd5e1",
    advice: "This is an Isolated Factor - low centrality and plays a subordinate role. It is lower priority but may signal niche concerns worth monitoring.",
  },
  "Impact Outcome": {
    quadrant: "IV",
    accentColor: "#2563eb",
    fill: "#eff6ff",
    border: "#93c5fd",
    advice: "This is an Impact Outcome - highly visible but driven by other factors. Improving it requires addressing the causal factors.",
  },
};

function getQuadrantKey(prominence, relation, meanProminence) {
  if (prominence >= meanProminence && relation >= 0) return "Core Engine";
  if (prominence <  meanProminence && relation >= 0) return "Hidden Influencer";
  if (prominence <  meanProminence && relation <  0) return "Isolated Factor";
  return "Impact Outcome";
}

/**
 * Cause-and-effect scatter diagram with four-quadrant strategy map and click advice.
 */
export default function CauseEffectDiagram({ scatterData, matrixMode, dotPositionsRef, dotPositions, setDotPositions }) {
  const [selectedDot, setSelectedDot] = useState(null);

  const xValues  = scatterData.map((d) => d.prominence);
  const yValues  = scatterData.map((d) => d.relation);
  const xDomMin  = Math.floor((Math.min(...xValues) - 0.5) * 10) / 10;
  const xDomMax  = Math.ceil( (Math.max(...xValues) + 0.5) * 10) / 10;
  const yDomMin  = Math.floor((Math.min(...yValues) - 0.2) * 10) / 10;
  const yDomMax  = Math.ceil( (Math.max(...yValues) + 0.2) * 10) / 10;

  const figNum     = matrixMode === "4x4" ? "1" : "2";
  const figSubject = matrixMode === "4x4" ? "Dimension" : "Indicator";

  const meanProminence = xValues.reduce((a, b) => a + b, 0) / xValues.length;

  const selectedStrategy = selectedDot
    ? QUADRANT_STRATEGY[getQuadrantKey(selectedDot.prominence, selectedDot.relation, meanProminence)]
    : null;

  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
      padding: "24px",
      marginBottom: "20px",
    }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "4px" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", textAlign: "left" }}>
          {figSubject} - Strategic Impact Map
        </h2>
      </div>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
        Four-quadrant strategy map for core resources and impact indicators of the affiliated restaurants' development.{" "}
        <span style={{ color: "#2563eb", fontWeight: 500 }}>Click any point</span> to reveal its strategic role and advice.
      </p>

      <div style={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <ScatterChart
            width={CHART.W} height={CHART.H}
            margin={{ top: CHART.MT, right: CHART.MR, left: CHART.ML, bottom: CHART.MB }}
            style={{ userSelect: "none" }}
          >
            {/* Quadrant background areas */}
            <ReferenceArea x1={meanProminence} x2={xDomMax} y1={0}       y2={yDomMax}  fill="#fef2f2" fillOpacity={0.5}
              label={{ value: "I: Core Engines",        position: "insideTopRight",    fontSize: 10, fill: "#dc2626", fontWeight: 600 }} />
            <ReferenceArea x1={xDomMin}        x2={meanProminence} y1={0} y2={yDomMax}  fill="#fffbeb" fillOpacity={0.7}
              label={{ value: "II: Hidden Influencers", position: "insideTopLeft",     fontSize: 10, fill: "#d97706", fontWeight: 600 }} />
            <ReferenceArea x1={xDomMin}        x2={meanProminence} y1={yDomMin} y2={0} fill="#f8fafc" fillOpacity={0.8}
              label={{ value: "III: Isolated Factors",  position: "insideBottomLeft",  fontSize: 10, fill: "#64748b", fontWeight: 600 }} />
            <ReferenceArea x1={meanProminence} x2={xDomMax} y1={yDomMin} y2={0}        fill="#eff6ff" fillOpacity={0.5}
              label={{ value: "IV: Impact Outcomes",    position: "insideBottomRight", fontSize: 10, fill: "#2563eb", fontWeight: 600 }} />

            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
            <XAxis
              type="number" dataKey="prominence" name="d+r"
              label={{ value: "D+R (Prominence)", position: "insideBottomRight", offset: -5, style: { fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#64748b" } }}
              domain={[xDomMin, xDomMax]}
              tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              type="number" dataKey="relation" name="d-r"
              label={{ value: "D-R (Relation)", angle: -90, position: "insideLeft", style: { fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#64748b" } }}
              domain={[yDomMin, yDomMax]}
              tick={{ fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => v.toFixed(1)}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                    fontFamily: "Inter, sans-serif",
                  }}>
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{d.name}</div>
                    <div style={{ color: "#64748b" }}>D+R: <strong style={{ color: "#0f172a" }}>{d.prominence.toFixed(4)}</strong></div>
                    <div style={{ color: "#64748b" }}>D-R: <strong style={{ color: d.fill }}>{d.relation > 0 ? "+" : ""}{d.relation.toFixed(4)}</strong></div>
                    <div style={{
                      marginTop: "6px",
                      color: d.fill, fontWeight: 600, fontSize: 11,
                      backgroundColor: d.fill + "22",
                      borderRadius: "999px", padding: "1px 8px", display: "inline-block",
                    }}>
                      {d.type}
                    </div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <ReferenceLine
              x={meanProminence} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 3"
              label={{ value: `Mean D+R = ${meanProminence.toFixed(2)}`, position: "insideTopLeft", fontSize: 10, fill: "#94a3b8" }}
            />
            <Scatter
              data={scatterData}
              isAnimationActive={false}
              shape={(props) => {
                const { cx, cy, payload } = props;
                if (!payload || cx == null || cy == null) return null;

                const prev = dotPositionsRef.current[payload.name];
                if (!prev || prev.cx !== cx || prev.cy !== cy) {
                  dotPositionsRef.current[payload.name] = { cx, cy };
                  setTimeout(() => setDotPositions({ ...dotPositionsRef.current }), 0);
                }

                const isSelected = selectedDot?.name === payload.name;
                return (
                  <g onClick={() => setSelectedDot(isSelected ? null : payload)} style={{ cursor: "pointer" }}>
                    {isSelected && (
                      <circle cx={cx} cy={cy} r={14} fill={payload.fill} fillOpacity={0.2} />
                    )}
                    <circle cx={cx} cy={cy}
                      r={isSelected ? 8 : 5}
                      fill={payload.fill}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text x={cx + 10} y={cy - 7} fill="#0f172a" fontSize={10} fontFamily="Inter, sans-serif" fontWeight={600}>
                      {payload.name}
                    </text>
                    <text x={cx + 10} y={cy + 4} fill={payload.fill} fontSize={9} fontFamily="Inter, sans-serif" fontWeight={500}>
                      {payload.type}
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

      {/* Strategic Advice Panel */}
      {selectedDot && selectedStrategy && (
        <div style={{
          marginTop: "20px",
          backgroundColor: selectedStrategy.fill,
          border: `1px solid ${selectedStrategy.border}`,
          borderLeft: `4px solid ${selectedStrategy.accentColor}`,
          borderRadius: "12px",
          padding: "16px 20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{
                  backgroundColor: selectedStrategy.fill,
                  color: selectedStrategy.accentColor,
                  border: `1px solid ${selectedStrategy.border}`,
                  borderRadius: "999px",
                  padding: "2px 10px",
                  fontWeight: 600, fontSize: 11,
                }}>
                  Quadrant {selectedStrategy.quadrant}: {getQuadrantKey(selectedDot.prominence, selectedDot.relation, meanProminence)}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: "6px" }}>
                Strategic Advice - {selectedDot.name}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: "#334155" }}>
                {selectedStrategy.advice}
              </p>
              <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: 12, color: "#64748b" }}>
                <span>D+R = <strong style={{ color: "#0f172a" }}>{selectedDot.prominence.toFixed(4)}</strong></span>
                <span>D-R = <strong style={{ color: selectedStrategy.accentColor }}>{selectedDot.relation > 0 ? "+" : ""}{selectedDot.relation.toFixed(4)}</strong></span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDot(null)}
              style={{
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: 14,
                color: "#64748b",
                borderRadius: "8px",
                padding: "4px 10px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

