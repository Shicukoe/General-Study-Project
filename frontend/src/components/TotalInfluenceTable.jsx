import { getHeatmapColor } from "../utils";

/** Heatmap-colored simplified total-influence matrix (Table 2 / Table 3). */
export default function TotalInfluenceTable({ labels, result, matrixMode }) {
  const simplified = result.simplified_total_influence_matrix ?? result.total_influence_matrix;
  const maxVal     = Math.max(...result.total_influence_matrix.flat());
  const decimals   = matrixMode === "4x4" ? 3 : 4;
  const tableNum   = matrixMode === "4x4" ? "2" : "3";
  const subject    = matrixMode === "4x4" ? "dimensions" : "indicators";

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
    padding: "24px",
    marginBottom: "20px",
  };

  const thStyle = {
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "10px 10px",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", textAlign: "left" }}>
          Key Relationship Heatmap
        </h2>
      </div>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
        Thresholded at α = mean(T); values below α are zeroed to highlight dominant relationships.
      </p>

      {/* Heatmap legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Low</span>
        <div style={{
          width: 140, height: 12, borderRadius: "999px",
          background: "linear-gradient(to right, #f8fafc, #e65100)",
          border: "1px solid #e2e8f0",
        }} />
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>High influence</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left" }}></th>
              {labels.map((label, j) => (
                <th key={j} style={thStyle}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {simplified.map((row, i) => (
              <tr key={i}>
                <td style={{
                  fontWeight: 600, fontSize: 12, color: "#334155",
                  padding: "8px 10px", whiteSpace: "nowrap",
                  borderBottom: "1px solid #f1f5f9",
                  textTransform: "uppercase", letterSpacing: "0.03em",
                }}>
                  {labels[i]}
                </td>
                {row.map((val, j) => (
                  <td
                    key={j}
                    style={{
                      backgroundColor: getHeatmapColor(val, maxVal),
                      color: val === 0 ? "#cbd5e1" : "#0f172a",
                      textAlign: "center",
                      padding: "8px 6px",
                      fontSize: 13,
                      fontWeight: val > 0 ? 500 : 400,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
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
