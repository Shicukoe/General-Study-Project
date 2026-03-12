import { DIM_GROUPS } from "../constants";

/**
 * Table 10: Dimension Weights — computed dynamically from backend DANP results.
 * Uses result4x4.ranking (direct dimension weights) if available, otherwise sums
 * indicator weights from result8x8 per DIM_GROUPS clustering.
 */
export default function DimensionWeightReferenceTable({ result4x4, result8x8 }) {
  let computedRows = null;
  let source = "";

  if (result4x4?.ranking) {
    const weightMap = Object.fromEntries(result4x4.ranking.map(([l, w]) => [l, w]));
    const rows = DIM_GROUPS.map(({ dim }) => ({ dimension: dim, weight: weightMap[dim] ?? 0 }));
    const sorted = [...rows].sort((a, b) => b.weight - a.weight);
    computedRows = rows.map((row) => ({
      ...row,
      priority: sorted.findIndex((r) => r.dimension === row.dimension) + 1,
    }));
    source = "4×4 dimension DANP analysis";
  } else if (result8x8?.ranking) {
    const rankMap = Object.fromEntries(result8x8.ranking.map(([l, w]) => [l, w]));
    const rows = DIM_GROUPS.map(({ dim, indicators }) => ({
      dimension: dim,
      weight: indicators.reduce((s, ind) => s + (rankMap[ind] ?? 0), 0),
    }));
    const sorted = [...rows].sort((a, b) => b.weight - a.weight);
    computedRows = rows.map((row) => ({
      ...row,
      priority: sorted.findIndex((r) => r.dimension === row.dimension) + 1,
    }));
    source = "8×8 indicator DANP (weights summed per dimension)";
  }

  const maxWeight = 1;

  const getPriorityStyle = (priority) => {
    if (priority === 1) return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    if (priority === 2) return { backgroundColor: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd" };
    if (priority === 3) return { backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
    return { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
  };

  const DIM_COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b"];

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
        Core Resource Distriburion
        </h2>
        {computedRows && (
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
            Aggregated influence weights and priority rankings for high-level resource categories.
          </p>
        )}
      </div>

      {!computedRows ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 14 }}>
          Run a 4×4 Dimensions or 8×8 Indicators analysis to calculate dimension weights.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Dimension
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Computed Weight
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Priority
                </th>
              </tr>
            </thead>
            <tbody>
              {computedRows.map((row, idx) => {
                const progressRatio = Math.max(0, Math.min(row.weight / maxWeight, 1));
                const progressDegrees = progressRatio * 360;
                const progressLabel = Math.round(progressRatio * 100);
                const badgeStyle = getPriorityStyle(row.priority);
                return (
                  <tr key={row.dimension} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: DIM_COLORS[idx % DIM_COLORS.length],
                          borderLeft: `3px solid ${DIM_COLORS[idx % DIM_COLORS.length]}`,
                          paddingLeft: 8,
                        }}
                      >
                        {row.dimension}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: `conic-gradient(${DIM_COLORS[idx % DIM_COLORS.length]} ${progressDegrees}deg, #e2e8f0 0deg)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                          title={`${progressLabel}%`}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              backgroundColor: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ fontSize: 8, color: "#64748b", fontWeight: 700, lineHeight: 1 }}>
                              {progressLabel}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontVariantNumeric: "tabular-nums",
                            minWidth: 52,
                            textAlign: "right",
                          }}
                        >
                          {row.weight.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 12px",
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 700,
                          ...badgeStyle,
                        }}
                      >
                        #{row.priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}