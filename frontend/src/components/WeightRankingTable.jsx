import { INDICATOR_ORDER, DIM_GROUPS } from "../constants";

/** Table 11: indicator extreme supermatrix — shows limit_matrix convergence values when available. */
export default function WeightRankingTable({ result }) {
  if (!result?.ranking) return null;

  const priorityMap = {};
  result.ranking.forEach((item, idx) => { priorityMap[item[0]] = idx + 1; });

  const labelToIdx = Object.fromEntries(INDICATOR_ORDER.map((l, i) => [l, i]));
  const limitMatrix = result.limit_matrix ?? null;

  const allVals = limitMatrix
    ? INDICATOR_ORDER.flatMap((r) =>
        INDICATOR_ORDER.map((c) => limitMatrix[labelToIdx[r]]?.[labelToIdx[c]] ?? 0)
      )
    : result.ranking.map(([, w]) => w);
  const maxVal = Math.max(...allVals) || 1;

  const getCellStyle = (val) => {
    const ratio = val / maxVal;
    if (ratio < 0.01) return { backgroundColor: "#f8fafc", color: "#94a3b8" };
    if (ratio < 0.3)  return { backgroundColor: "#eff6ff", color: "#1e40af" };
    if (ratio < 0.6)  return { backgroundColor: "#bfdbfe", color: "#1e3a8a" };
    if (ratio < 0.85) return { backgroundColor: "#3b82f6", color: "#ffffff" };
    return { backgroundColor: "#1d4ed8", color: "#ffffff" };
  };

  const totalRanking = result.ranking.length;
  const getPriorityStyle = (priority) => {
    if (priority === 1) return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
    if (priority <= 3) return { backgroundColor: "#e0f2fe", color: "#075985", border: "1px solid #bae6fd" };
    if (priority <= Math.ceil(totalRanking / 2)) return { backgroundColor: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" };
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
        Global Resource Weights
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}>
          Extreme Supermatrix displays normalized weights and final rankings for all 8 indicators. These values determine the 'Strategic Focus' for resource allocation and business innovation.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, whiteSpace: "nowrap" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  minWidth: 110,
                }}
              >
                Dimension
              </th>
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  minWidth: 130,
                }}
              >
                Indicator
              </th>
              {INDICATOR_ORDER.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "6px 4px",
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    maxWidth: 52,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {col}
                </th>
              ))}
              <th
                style={{
                  padding: "8px 12px",
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Rank
              </th>
            </tr>
          </thead>
          <tbody>
            {DIM_GROUPS.flatMap(({ dim, indicators }, dimIdx) =>
              indicators.map((indicator, rowIdx) => {
                const rankingItem = result.ranking.find((item) => item[0] === indicator);
                if (!rankingItem) return null;
                const rowI = labelToIdx[indicator];
                const badgeStyle = getPriorityStyle(priorityMap[indicator]);
                return (
                  <tr key={indicator} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {rowIdx === 0 && (
                      <td
                        rowSpan={indicators.length}
                        style={{
                          padding: "10px 12px",
                          fontWeight: 700,
                          verticalAlign: "middle",
                          borderRight: `3px solid ${DIM_COLORS[dimIdx % DIM_COLORS.length]}`,
                          color: DIM_COLORS[dimIdx % DIM_COLORS.length],
                          fontSize: 12,
                          paddingLeft: 12,
                        }}
                      >
                        {dim}
                      </td>
                    )}
                    <td style={{ padding: "7px 12px", fontSize: 12, color: "#334155", fontWeight: 500 }}>
                      {indicator}
                    </td>
                    {INDICATOR_ORDER.map((col) => {
                      const colJ = labelToIdx[col];
                      const cellVal =
                        limitMatrix && rowI !== undefined && colJ !== undefined
                          ? limitMatrix[rowI][colJ]
                          : rankingItem[1];
                      const { backgroundColor, color } = getCellStyle(cellVal);
                      return (
                        <td
                          key={col}
                          style={{
                            padding: "6px 4px",
                            textAlign: "center",
                            backgroundColor,
                            color,
                            fontSize: 10,
                            fontWeight: col === indicator ? 700 : 400,
                          }}
                        >
                          {cellVal.toFixed(4)}
                        </td>
                      );
                    })}
                    <td style={{ padding: "7px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "999px",
                          fontSize: 11,
                          fontWeight: 700,
                          ...badgeStyle,
                        }}
                      >
                        #{priorityMap[indicator]}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
