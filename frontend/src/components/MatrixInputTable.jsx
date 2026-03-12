/** Editable direct-influence matrix table with Analyze button. */
import { useState, useEffect } from "react";

/** Editable direct-influence matrix table with Analyze button. */
export default function MatrixInputTable({ labels, matrix, onChange, onAnalyze, onLoadExample, onClear, loading, error }) {
  const [focusCell, setFocusCell] = useState(null);
  const n = labels.length;
  const scaleLevels = [
    { value: 0, label: "No impact" },
    { value: 1, label: "Low impact" },
    { value: 2, label: "Middle impact" },
    { value: 3, label: "High impact" },
    { value: 4, label: "Extremely high impact" },
  ];

  // Clear crosshair when matrix size changes (mode switch)
  useEffect(() => { setFocusCell(null); }, [n]);

  const getHeatmapTone = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return { bg: "#ffffff", text: "#0f172a" };
    }
    if (num <= 0) return { bg: "#f8fafc", text: "#0f172a" };
    if (num > 0 && num < 3) return { bg: "#E0F2FE", text: "#0f172a" };
    if (num >= 3 && num < 4) return { bg: "#7DD3FC", text: "#082f49" };
    return { bg: "#0284C7", text: "#ffffff" };
  };

  const cornerStyle = {
    border: "1px solid #e2e8f0",
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    fontSize: 12,
    letterSpacing: "0.04em",
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: 600,
  };

  const getColHeaderStyle = (j) => ({
    border: "1px solid #e2e8f0",
    padding: "10px 12px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748B",
    backgroundColor: focusCell?.col === j ? "#f1f5f9" : "#f8fafc",
    transition: "background-color 0.12s ease",
  });

  const getRowHeaderStyle = (i) => ({
    border: "1px solid #e2e8f0",
    padding: "10px 12px",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748B",
    whiteSpace: "nowrap",
    backgroundColor: focusCell?.row === i ? "#f1f5f9" : "#f8fafc",
    transition: "background-color 0.12s ease",
  });

  const getCellStyle = (i, j) => {
    const isDiag = i === j;
    const isActive  = focusCell?.row === i && focusCell?.col === j;
    const isRowOrCol = focusCell && (focusCell.row === i || focusCell.col === j);
    const tone = getHeatmapTone(matrix[i][j]);
    return {
      border: "1px solid #e2e8f0",
      padding: "2px",
      textAlign: "center",
      fontSize: 15,
      backgroundColor: isDiag ? "#f1f5f9" : tone.bg,
      color: isDiag ? "#94a3b8" : tone.text,
      boxShadow: isDiag
        ? "none"
        : isActive
        ? "inset 0 0 0 2px #0369a1"
        : isRowOrCol
        ? "inset 0 0 0 1px #7dd3fc"
        : "none",
      transition: "background-color 0.3s ease, color 0.3s ease",
    };
  };

  return (
    <div style={{
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#fff",
    }}>
      <h2 style={{ fontSize: 20, marginTop: 0, marginBottom: 14, textAlign: "left", color: "#0f172a" }}>Resource Impact Assessment</h2>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: "4px",
          color: "#b91c1c",
          padding: "10px 16px",
          marginBottom: "14px",
          textAlign: "center",
          fontSize: 13,
          fontWeight: "bold",
        }}>
          ⚠ {error}
        </div>
      )}

      <div style={{
        marginBottom: "16px",
        padding: "12px 14px",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: "8px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Input Scale
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {scaleLevels.map(({ value, label }) => (
            <div
              key={value}
              style={{
                border: "1px solid #94a3b8",
                borderRadius: "999px",
                padding: "5px 11px",
                backgroundColor: "#fff",
                fontSize: 13,
              }}
            >
              <strong>{value}</strong>: {label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", margin: "10px 0", fontSize: 15 }}>
          <thead>
            <tr>
              <th style={cornerStyle}></th>
              {labels.map((label, j) => (
                <th key={j} style={getColHeaderStyle(j)}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td style={getRowHeaderStyle(i)}>{labels[i]}</td>
                {row.map((val, j) => (
                  <td key={j} style={getCellStyle(i, j)}>
                    {i === j ? (
                      <span style={{ color: "#94a3b8", fontSize: 14 }}>0</span>
                    ) : (
                      <input
                        type="number" min="0" max="4" step="1" value={val}
                        onFocus={() => setFocusCell({ row: i, col: j })}
                        onBlur={() => setFocusCell(null)}
                        onChange={(e) => onChange(i, j, e.target.value)}
                        style={{
                          width: "88px",
                          padding: "11px 8px",
                          border: "none",
                          borderRadius: "8px",
                          fontFamily: "Inter, Public Sans, Plus Jakarta Sans, sans-serif",
                          fontSize: 15,
                          fontWeight: 600,
                          textAlign: "center",
                          backgroundColor: "transparent",
                          color: getHeatmapTone(val).text,
                          outline: "none",
                          transition: "background-color 0.3s ease, color 0.3s ease",
                        }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: "center", marginTop: "18px", display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={onLoadExample}
          disabled={loading}
          style={{
            fontSize: 14,
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #94a3b8",
            backgroundColor: "transparent",
            color: "#334155",
            fontWeight: 600,
          }}
        >
          Load Example
        </button>
        <button
          onClick={onAnalyze}
          disabled={loading}
          style={{
            fontSize: 14,
            padding: "10px 22px",
            borderRadius: "8px",
            fontWeight: "bold",
            letterSpacing: "0.4px",
            background: loading
              ? "linear-gradient(90deg, #93c5fd 0%, #60a5fa 100%)"
              : "linear-gradient(90deg, #0284c7 0%, #2563eb 100%)",
            color: "#fff",
            border: "1px solid #1e3a8a",
            boxShadow: "0 8px 14px -6px rgba(37,99,235,0.5)",
          }}
        >
          {loading ? "PROCESSING..." : "ANALYZE"}
        </button>
        <button
          onClick={onClear}
          disabled={loading}
          style={{
            fontSize: 14,
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #94a3b8",
            backgroundColor: "transparent",
            color: "#334155",
            fontWeight: 600,
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
