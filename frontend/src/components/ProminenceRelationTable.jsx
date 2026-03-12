/** D / R / D+R / D−R summary table with color-coded role badges. */
export default function ProminenceRelationTable({ labels, result, matrixMode }) {
  const meanProminence = result.prominence.reduce((a, b) => a + b, 0) / result.prominence.length;
  const decimals = matrixMode === "4x4" ? 3 : 4;
  const tableNum = matrixMode === "4x4" ? "4" : "5";
  const subject  = matrixMode === "4x4" ? "dimensions" : "indicators";

  const getRoleLabel = (prominence, relation) => {
    if (relation > 0.1) {
      return prominence > meanProminence
        ? { label: "Driving Factor",    color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" }
        : { label: "Hidden Influencer", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" };
    } else if (relation < -0.1) {
      return { label: "Resultant Factor", color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" };
    } else {
      return { label: "Independent Core", color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" };
    }
  };

  const rows = labels.map((label, i) => {
    const role = getRoleLabel(result.prominence[i], result.relation[i]);
    return { label, d: result.d[i], r: result.r[i], prominence: result.prominence[i], relation: result.relation[i], role };
  });

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
    padding: "10px 12px",
    borderBottom: "2px solid #e2e8f0",
    textAlign: "center",
    whiteSpace: "nowrap",
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", textAlign: "left" }}>
          Centrality & Causality Analysis
        </h2>
      </div>
      <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b" }}>
        Mean D+R = <strong style={{ color: "#0f172a" }}>{meanProminence.toFixed(decimals)}</strong>
        {" "}— centrality threshold used to classify each {matrixMode === "4x4" ? "dimension" : "indicator"}'s strategic role.
      </p>

      {/* Legend */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {[
          { label: "Driving Factor",    color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", desc: "High cause, high centrality" },
          { label: "Hidden Influencer", color: "#d97706", bg: "#fffbeb", border: "#fcd34d", desc: "High cause, low centrality" },
          { label: "Resultant Factor",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", desc: "Effect (D−R < 0)" },
          { label: "Independent Core",  color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", desc: "D−R ≈ 0" },
        ].map(({ label, color, bg, border, desc }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{
              backgroundColor: bg, color, border: `1px solid ${border}`,
              borderRadius: "999px", padding: "2px 10px",
              fontWeight: 600, fontSize: 11, whiteSpace: "nowrap",
            }}>
              {label}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 11 }}>{desc}</span>
          </div>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: "left" }}>{matrixMode === "4x4" ? "Dimension" : "Indicator"}</th>
              <th style={thStyle} title="Dispatching: Row sum of T">D</th>
              <th style={thStyle} title="Receiving: Column sum of T">R</th>
              <th style={thStyle} title="Prominence / Centrality: D + R">D+R</th>
              <th style={thStyle} title="Relation / Causality: D − R">D−R</th>
              <th style={thStyle}>Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, d, r, prominence, relation, role }, idx) => (
              <tr key={label} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                <td style={{
                  fontWeight: 600, fontSize: 12, color: "#334155",
                  padding: "10px 12px", whiteSpace: "nowrap",
                  textTransform: "uppercase", letterSpacing: "0.03em",
                  borderBottom: "1px solid #f1f5f9",
                }}>
                  {label}
                </td>
                <td style={{ textAlign: "center", padding: "10px 12px", color: "#475569", borderBottom: "1px solid #f1f5f9" }}>
                  {d.toFixed(decimals)}
                </td>
                <td style={{ textAlign: "center", padding: "10px 12px", color: "#475569", borderBottom: "1px solid #f1f5f9" }}>
                  {r.toFixed(decimals)}
                </td>
                <td style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, color: "#0f172a", borderBottom: "1px solid #f1f5f9" }}>
                  {prominence.toFixed(decimals)}
                </td>
                <td style={{
                  textAlign: "center", padding: "10px 12px", fontWeight: 700,
                  color: relation > 0 ? "#dc2626" : "#2563eb",
                  borderBottom: "1px solid #f1f5f9",
                }}>
                  {relation > 0 ? "+" : ""}{relation.toFixed(decimals)}
                </td>
                <td style={{ textAlign: "center", padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{
                    backgroundColor: role.bg, color: role.color,
                    border: `1px solid ${role.border}`,
                    borderRadius: "999px", padding: "3px 12px",
                    fontWeight: 600, fontSize: 11, whiteSpace: "nowrap",
                  }}>
                    {role.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
