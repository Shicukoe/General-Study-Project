/** Mode toggle (4×4 / 8×8). */
export default function ModeSelector({ matrixMode, onModeChange }) {
  const baseBtn = {
    borderRadius: "999px",
    border: "1px solid transparent",
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.02em",
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "18px" }}>
      <div style={{ display: "inline-flex", padding: "4px", borderRadius: "999px", backgroundColor: "#eef2ff", border: "1px solid #dbeafe", gap: "4px" }}>
        <button
          onClick={() => onModeChange("4x4")}
          style={{
            ...baseBtn,
            backgroundColor: matrixMode === "4x4" ? "#ffffff" : "transparent",
            color: matrixMode === "4x4" ? "#0f172a" : "#64748b",
            boxShadow: matrixMode === "4x4" ? "0 1px 2px rgba(15, 23, 42, 0.12)" : "none",
          }}
        >
          4x4 Dimensions
        </button>
        <button
          onClick={() => onModeChange("8x8")}
          style={{
            ...baseBtn,
            backgroundColor: matrixMode === "8x8" ? "#ffffff" : "transparent",
            color: matrixMode === "8x8" ? "#0f172a" : "#64748b",
            boxShadow: matrixMode === "8x8" ? "0 1px 2px rgba(15, 23, 42, 0.12)" : "none",
          }}
        >
          8x8 Indicators
        </button>
      </div>
    </div>
  );
}
