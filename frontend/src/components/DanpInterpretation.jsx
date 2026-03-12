import { useState } from "react";
import axios from "axios";

/**
 * Strategic Interpretation panel for the Priority Ranking (DANP) tab.
 *
 * Sends the DANP ranking to POST /interpret-danp, which:
 *   1. Picks the top-4 indicators by weight.
 *   2. Maps each to its evaluation factors.
 *   3. Asks the Ollama LLM to produce a formal strategic report.
 *
 * Props:
 *   result8x8  — the /analyze response for the 8×8 indicator run
 */
export default function DanpInterpretation({ result8x8 }) {
  const [report, setReport]         = useState(null);
  const [top4, setTop4]             = useState(null);
  const [modelUsed, setModelUsed]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const canRun = Boolean(result8x8?.ranking);

  const handleGenerate = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setTop4(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";
      const res = await axios.post(`${apiUrl}/interpret-danp`, {
        ranking: result8x8.ranking,
        labels:  result8x8.ranking.map(([l]) => l),
      });
      setReport(res.data.report);
      setTop4(res.data.top4);
      setModelUsed(res.data.model_used);
    } catch (err) {
      setError(
        err.response?.data?.detail ??
          "Could not connect to the LLM. Make sure Ollama is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const top4Preview = canRun
    ? [...result8x8.ranking].sort((a, b) => b[1] - a[1]).slice(0, 4)
    : [];

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
      {/* ── Section header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
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
          Business Model Analyze and Suggestion
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
          Analysis of top impact factors with strategic development recommendations (Assisted by AI Model Ollama LLM).
        </p>
      </div>

      {/* ── Top-4 preview ─────────────────────────────────────────────── */}
      {canRun && !report && (
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Top-4 indicators to interpret
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {top4Preview.map(([label, weight], i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "7px 12px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "999px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {Number(weight).toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={handleGenerate}
          disabled={!canRun || loading}
          style={{
            padding: "9px 22px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: canRun && !loading ? "pointer" : "not-allowed",
            opacity: canRun && !loading ? 1 : 0.55,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "999px",
            boxShadow: canRun && !loading ? "0 4px 10px rgba(37,99,235,0.3)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Generating report…" : "Generate Strategic Report"}
        </button>

        {report && (
          <button
            onClick={() => { setReport(null); setTop4(null); setModelUsed(null); }}
            style={{
              padding: "9px 18px",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              transition: "all 0.15s ease",
            }}
          >
            × Clear Report
          </button>
        )}
      </div>

      {!canRun && (
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>
          Run an 8×8 Indicators analysis first to unlock this feature.
        </p>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            border: "1px solid #fca5a5",
            borderLeft: "4px solid #ef4444",
            backgroundColor: "#fef2f2",
            borderRadius: "10px",
            color: "#991b1b",
            fontSize: 13,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Report output ─────────────────────────────────────────────── */}
      {report && (
        <div style={{ marginTop: 24 }}>
          {/* Top-4 summary cards */}
          {top4 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              {top4.map((item, i) => (
                <div
                  key={item.indicator}
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    minWidth: 190,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        borderRadius: "999px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
                      {item.indicator}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#1e40af", marginBottom: 4 }}>
                    Weight: <strong>{item.weight.toFixed(4)}</strong>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>
                    <strong>Evaluation factors:</strong> {item.factors.join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report text */}
          <strong>Report:</strong> 
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "20px 24px",
              fontSize: 14,
              color: "#1e293b",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {report}
          </div>

          {modelUsed && (
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, textAlign: "right" }}>
              Generated by Ollama model: <em>{modelUsed}</em>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
