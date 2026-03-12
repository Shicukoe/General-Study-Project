import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PAPER_BENCHMARK_PR } from "../constants";

// Paper expert benchmark (mirrors PAPER_DATA in backend)
const PAPER_CONTEXT = {
  "4x4": {
    causes:  ["Personal ability", "Organizational ability"],
    effects: ["Intangible assets", "Tangible assets"],
  },
  "8x8": {
    causes:  ["Marketing resources", "Human resources", "Financial resources"],
    effects: ["Brand/business reputation resources", "Physical resources", "Organizational resources"],
  },
};

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  padding: "10px 14px",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
};

/**
 * Feature 3: Gap-to-Expert Analysis using a local Ollama LLM.
 */
export default function GapAnalysis({ result, labels, matrixMode }) {
  const [report,  setReport]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [modelMeta, setModelMeta] = useState(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    // Reset generated text output when switching between Dimensions and Indicators.
    requestSeqRef.current += 1;
    setReport("");
    setError("");
    setModelMeta(null);
    setLoading(false);
  }, [matrixMode]);

  const paperData = PAPER_CONTEXT[matrixMode];
  const benchmark = PAPER_BENCHMARK_PR[matrixMode];
  const meanProminence = result.prominence.reduce((a, b) => a + b, 0) / result.prominence.length;
  const decimals = matrixMode === "4x4" ? 3 : 4;

  const formatSigned = (v, d) => `${v > 0 ? "+" : ""}${v.toFixed(d)}`;

  const paired = labels.map((label, i) => ({
    label,
    prominence: result.prominence[i],
    relation:   result.relation[i],
  }));
  const userTopCauses  = [...paired].sort((a, b) => b.relation - a.relation).filter(d => d.relation > 0).slice(0, 3);

  const benchmarkPlot = benchmark
    ? benchmark.rows.map((r) => ({
      name: r.label,
      prominence: r.prominence,
      relation: r.relation,
      source: "Paper benchmark",
    }))
    : [];

  const userPlot = paired.map((d) => ({
    name: d.label,
    prominence: d.prominence,
    relation: d.relation,
    source: "Your result",
  }));

  const allProminence = [...benchmarkPlot, ...userPlot].map((d) => d.prominence);
  const allRelation = [...benchmarkPlot, ...userPlot].map((d) => d.relation);
  const xDomMin = allProminence.length ? Math.floor((Math.min(...allProminence) - 0.6) * 10) / 10 : 0;
  const xDomMax = allProminence.length ? Math.ceil((Math.max(...allProminence) + 0.6) * 10) / 10 : 1;
  const yDomMin = allRelation.length ? Math.floor((Math.min(...allRelation) - 0.2) * 10) / 10 : -1;
  const yDomMax = allRelation.length ? Math.ceil((Math.max(...allRelation) + 0.2) * 10) / 10 : 1;

  const handleGenerate = async () => {
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;
    const modeAtRequestStart = matrixMode;

    setLoading(true);
    setError("");
    setReport("");
    setModelMeta(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await axios.post(`${apiUrl}/gap-analysis`, {
        labels,
        prominence: result.prominence,
        relation:   result.relation,
        mode:       matrixMode,
      });

      if (requestSeqRef.current !== requestId || modeAtRequestStart !== matrixMode) return;

      setReport(res.data.report);
      setModelMeta({
        requested: res.data.model_requested,
        used: res.data.model_used,
        fallback: Boolean(res.data.used_fallback_model),
      });
    } catch (err) {
      if (requestSeqRef.current !== requestId || modeAtRequestStart !== matrixMode) return;

      setError(
        err.response?.data?.detail ??
        "Could not reach Ollama. Make sure it is running: open a terminal and run 'ollama serve'."
      );
    } finally {
      if (requestSeqRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const axisStyle = { fontFamily: "Inter, sans-serif", fontSize: 11, fill: "#94a3b8" };
  const axisLineStyle = { stroke: "#e2e8f0" };

  const renderPointLabel = (color) => ({ x, y, value }) => {
    if (x == null || y == null || !value) return null;
    const labelX = x + 8;

    return (
      <text
        x={labelX}
        y={y}
        fill={color}
        fontSize={8}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
        textAnchor="start"
        dominantBaseline="middle"
      >
        {value}
      </text>
    );
  };

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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", textAlign: "left" }}>
          Expert Benchmark Comparison
        </h2>
      </div>
      <p style={{ margin: "0 0 20px 0", fontSize: 13, color: "#64748b" }}>
        Side-by-side analysis of your DEMATEL results against the research paper's expert findings with the assistance of AI model Ollama LLM.
      </p>

      {/*Benchmark side-by-side graphs */}
      {benchmark && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "14px",
          }}>

            {/* User result mini-chart */}
            <div style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              padding: "14px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#d97706", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#d97706", display: "inline-block" }}></span>
                Your Result
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 16, right: 16, left: 4, bottom: 20 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis type="number" dataKey="prominence" name="d+r"
                      domain={[xDomMin, xDomMax]} tickFormatter={(v) => v.toFixed(2)}
                      tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle}
                      label={{ value: "D+R", position: "insideBottomRight", offset: -5, style: { ...axisStyle } }}
                    />
                    <YAxis type="number" dataKey="relation" name="d-r"
                      domain={[yDomMin, yDomMax]} tickFormatter={(v) => v.toFixed(2)}
                      tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle}
                      label={{ value: "D-R", angle: -90, position: "insideLeft", style: { ...axisStyle } }}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle}>
                          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{d.name}</div>
                          <div style={{ color: "#64748b" }}>D+R: <strong style={{ color: "#0f172a" }}>{d.prominence.toFixed(decimals)}</strong></div>
                          <div style={{ color: "#64748b" }}>D-R: <strong style={{ color: "#d97706" }}>{formatSigned(d.relation, decimals)}</strong></div>
                        </div>
                      );
                    }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                    <ReferenceLine x={meanProminence} stroke="#d97706" strokeDasharray="5 5"
                      label={{ value: `Mean = ${meanProminence.toFixed(decimals)}`, position: "insideTopRight", fontSize: 10, fill: "#d97706" }}
                    />
                    <Scatter
                      name="Your result"
                      data={userPlot}
                      fill="#d97706"
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="name" content={renderPointLabel("#92400e")} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Paper benchmark mini-chart */}
            <div style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#64748b", display: "inline-block" }}></span>
                Paper Benchmark
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 16, right: 16, left: 4, bottom: 20 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                    <XAxis type="number" dataKey="prominence" name="d+r"
                      domain={[xDomMin, xDomMax]} tickFormatter={(v) => v.toFixed(2)}
                      tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle}
                      label={{ value: "D+R", position: "insideBottomRight", offset: -5, style: { ...axisStyle } }}
                    />
                    <YAxis type="number" dataKey="relation" name="d-r"
                      domain={[yDomMin, yDomMax]} tickFormatter={(v) => v.toFixed(2)}
                      tick={axisStyle} axisLine={axisLineStyle} tickLine={axisLineStyle}
                      label={{ value: "D-R", angle: -90, position: "insideLeft", style: { ...axisStyle } }}
                    />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={tooltipStyle}>
                          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>{d.name}</div>
                          <div style={{ color: "#64748b" }}>D+R: <strong style={{ color: "#0f172a" }}>{d.prominence.toFixed(decimals)}</strong></div>
                          <div style={{ color: "#64748b" }}>D-R: <strong style={{ color: "#64748b" }}>{formatSigned(d.relation, decimals)}</strong></div>
                        </div>
                      );
                    }} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
                    <ReferenceLine x={benchmark.averageProminence} stroke="#94a3b8" strokeDasharray="5 5"
                      label={{ value: `Mean = ${benchmark.averageProminence.toFixed(2)}`, position: "insideTopRight", fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Scatter
                      name="Paper benchmark"
                      data={benchmarkPlot}
                      fill="#64748b"
                      isAnimationActive={false}
                    >
                      <LabelList dataKey="name" content={renderPointLabel("#475569")} />
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
          <p style={{ margin: "8px 0 0 0", fontSize: 11, color: "#94a3b8" }}>
            Both charts share the same axis range for direct visual comparison.
          </p>
        </div>
      )}

      {/* â”€â”€ Comparison preview cards â”€â”€ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {/* Your top causes */}
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fca5a5",
          borderRadius: "12px", padding: "14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            Your Top Causes
          </div>
          {userTopCauses.length ? userTopCauses.map((d, i) => (
            <div key={d.label} style={{ fontSize: 12, color: "#0f172a", marginBottom: "5px", display: "flex", justifyContent: "space-between", gap: "6px" }}>
              <span>{i + 1}. {d.label}</span>
              <span style={{ color: "#dc2626", fontWeight: 600, whiteSpace: "nowrap" }}>+{d.relation.toFixed(3)}</span>
            </div>
          )) : <div style={{ fontSize: 12, color: "#94a3b8" }}>No causes identified</div>}
        </div>

        {/* Expert benchmark causes */}
        <div style={{
          backgroundColor: "#eff6ff", border: "1px solid #93c5fd",
          borderRadius: "12px", padding: "14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            Expert Benchmark Causes
          </div>
          {paperData.causes.map((c, i) => (
            <div key={c} style={{ fontSize: 12, color: "#0f172a", marginBottom: "5px" }}>
              {i + 1}. {c}
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Generate button â”€â”€ */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 32px",
            cursor: loading ? "default" : "pointer",
            background: loading ? "#e2e8f0" : "#1D61E7",
            color: loading ? "#94a3b8" : "#ffffff",
            border: "none",
            borderRadius: "999px",
            fontWeight: 600,
            fontSize: 14,
            boxShadow: loading ? "none" : "0 4px 12px rgba(29,97,231,0.3)",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? "Generating insight" : "Generate Comparison Insight"}
        </button>
      </div>

      {/* â”€â”€ Error â”€â”€ */}
      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fca5a5",
          borderLeft: "4px solid #dc2626",
          borderRadius: "10px",
          padding: "12px 16px",
          fontSize: 13,
          color: "#991b1b",
          marginBottom: "12px",
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {report && (
        <div style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #86efac",
          borderLeft: "4px solid #16a34a",
          borderRadius: "12px",
          padding: "20px",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#14532d", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>AI-Generated Strategic Insight Report</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap", color: "#166534" }}>
            {report}
          </p>
          <div style={{ marginTop: "14px", fontSize: 11, color: "#4ade80", borderTop: "1px solid #bbf7d0", paddingTop: "10px" }}>
            Generated by Ollama
            {modelMeta?.used ? ` (${modelMeta.used}${modelMeta.fallback ? ", auto-selected" : ""})` : ""}
            {modelMeta?.requested && modelMeta?.used && modelMeta.requested !== modelMeta.used
              ? ` Requested ${modelMeta.requested}`
              : ""}
            {" Results are AI-generated and should be critically reviewed."}
          </div>
        </div>
      )}
    </div>
  );
}
