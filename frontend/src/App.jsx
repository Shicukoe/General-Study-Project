import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { DIMENSIONS_4X4, DIMENSIONS_8X8, DIM_GROUPS, EXAMPLE_4X4, EXAMPLE_8X8 } from "./constants";
import ModeSelector from "./components/ModeSelector";
import MatrixInputTable from "./components/MatrixInputTable";
import TotalInfluenceTable from "./components/TotalInfluenceTable";
import ProminenceRelationTable from "./components/ProminenceRelationTable";
import CauseEffectDiagram from "./components/CauseEffectDiagram";
import WeightRankingTable from "./components/WeightRankingTable";
import RadarAnalysis from "./components/RadarAnalysis";
import GapAnalysis from "./components/GapAnalysis";
import DimensionWeightReferenceTable from "./components/DimensionWeightReferenceTable";
import DanpInterpretation from "./components/DanpInterpretation";

// ─── Main App Component ───────────────────────────────────────────────────────

const createEmptyMatrix = (size) =>
  Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i === j ? 0 : ""))
  );

const referencePaperPath = "/docs/Mathematical Problems in Engineering - 2022 - Chen - Integrating the MCDM Method to Explore the Business Model Innovation.pdf";

function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [influenceMode, setInfluenceMode] = useState("4x4");
  const [showReferenceModal, setShowReferenceModal] = useState(false);

  // Separate matrix / result state per mode so switching modes preserves data
  const [matrixMode, setMatrixMode] = useState("4x4");
  const [matrix4x4,  setMatrix4x4]  = useState(() => createEmptyMatrix(4));
  const [matrix8x8,  setMatrix8x8]  = useState(() => createEmptyMatrix(8));
  const [result4x4,  setResult4x4]  = useState(null);
  const [result8x8,  setResult8x8]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [matrixError, setMatrixError] = useState(null);

  // Exact dot pixel positions captured from recharts shape callback
  const dotPositionsRef = useRef({});
  const [dotPositions, setDotPositions] = useState({});

  // ── Derived values for the currently active mode ──────────────────────────
  const labels           = matrixMode === "4x4" ? DIMENSIONS_4X4 : DIMENSIONS_8X8;
  const matrix           = matrixMode === "4x4" ? matrix4x4 : matrix8x8;
  const setMatrix        = matrixMode === "4x4" ? setMatrix4x4 : setMatrix8x8;
  const influenceLabels  = influenceMode === "4x4" ? DIMENSIONS_4X4 : DIMENSIONS_8X8;
  const influenceResult  = influenceMode === "4x4" ? result4x4 : result8x8;

  // Clear stale dot positions whenever a different influence view is shown.
  useEffect(() => {
    dotPositionsRef.current = {};
    setDotPositions({});
  }, [influenceMode, influenceResult]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleReset = () => {
    if (matrixMode === "4x4") {
      setMatrix4x4(createEmptyMatrix(4));
      setResult4x4(null);
    } else {
      setMatrix8x8(createEmptyMatrix(8));
      setResult8x8(null);
    }
    setMatrixError(null);
  };

  const handleCellChange = (i, j, value) => {
    const updated = matrix.map((row) => [...row]);
    updated[i][j] = value === "" ? "" : value;
    setMatrix(updated);
    if (matrixError) setMatrixError(null);
  };

  const handleModeChange = (mode) => {
    setMatrixMode(mode);
    setMatrixError(null);
  };

  const handleLoadExample = () => {
    const example = matrixMode === "4x4" ? EXAMPLE_4X4 : EXAMPLE_8X8;
    if (matrixMode === "4x4") { setMatrix4x4(example.matrix); setResult4x4(null); }
    else { setMatrix8x8(example.matrix); setResult8x8(null); }
    setMatrixError(null);
  };

  const buildDimensionMapping = (targetLabels) =>
    targetLabels.map((label) => {
      const indicatorIndex = DIM_GROUPS.findIndex(({ indicators }) =>
        indicators.some((ind) => ind.toLowerCase() === label.toLowerCase())
      );
      if (indicatorIndex >= 0) return indicatorIndex;
      const dimensionIndex = DIM_GROUPS.findIndex(({ dim }) =>
        dim.toLowerCase() === label.toLowerCase()
      );
      return dimensionIndex >= 0 ? dimensionIndex : targetLabels.indexOf(label);
    });

  const validateAndPrepareMatrix = (rawMatrix, modeName) => {
    for (let i = 0; i < rawMatrix.length; i += 1) {
      for (let j = 0; j < rawMatrix[i].length; j += 1) {
        if (i === j) continue;
        const rawValue = rawMatrix[i][j];
        if (rawValue === "" || rawValue === null || rawValue === undefined) {
          return {
            isValid: false,
            error: `Please complete the ${modeName} matrix before analyzing. Use values from 0 to 4.`,
          };
        }
        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 4) {
          return {
            isValid: false,
            error: `The ${modeName} matrix has invalid values. Each influence score must be between 0 and 4.`,
          };
        }
      }
    }

    const numericMatrix = rawMatrix.map((row, i) =>
      row.map((value, j) => (i === j ? 0 : Number(value)))
    );

    const allZero = numericMatrix.every((row, i) => row.every((val, j) => i === j || val === 0));
    if (allZero) {
      return {
        isValid: false,
        error: `The ${modeName} matrix cannot be all zeros. Please enter at least one non-zero influence value.`,
      };
    }

    return { isValid: true, matrix: numericMatrix };
  };

  const handleAnalyze = async () => {
    const modeChecks = matrixMode === "4x4"
      ? [
          { mode: "4x4", name: "4x4 Dimensions", matrix: matrix4x4 },
          { mode: "8x8", name: "8x8 Indicators", matrix: matrix8x8 },
        ]
      : [
          { mode: "8x8", name: "8x8 Indicators", matrix: matrix8x8 },
          { mode: "4x4", name: "4x4 Dimensions", matrix: matrix4x4 },
        ];

    const prepared = {};
    for (const check of modeChecks) {
      const validation = validateAndPrepareMatrix(check.matrix, check.name);
      if (!validation.isValid) {
        setMatrixMode(check.mode);
        setActiveTab("input");
        setMatrixError(validation.error);
        return;
      }
      prepared[check.mode] = validation.matrix;
    }

    setMatrixError(null);
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "/api";

      const [res4, res8] = await Promise.all([
        axios.post(`${apiUrl}/analyze`, {
          matrix: prepared["4x4"],
          labels: DIMENSIONS_4X4,
          dimension_mapping: buildDimensionMapping(DIMENSIONS_4X4),
        }),
        axios.post(`${apiUrl}/analyze`, {
          matrix: prepared["8x8"],
          labels: DIMENSIONS_8X8,
          dimension_mapping: buildDimensionMapping(DIMENSIONS_8X8),
        }),
      ]);

      setResult4x4(res4.data);
      setResult8x8(res8.data);
      setInfluenceMode(matrixMode);
      setActiveTab("influence");
    } catch (err) {
      alert(err.response?.data?.detail ?? "Backend connection error. Make sure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Scatter data derived from current analysis result ─────────────────────

  const scatterData = influenceResult
    ? influenceLabels.map((label, i) => ({
        name:       label,
        prominence: parseFloat(influenceResult.prominence[i].toFixed(4)),
        relation:   parseFloat(influenceResult.relation[i].toFixed(4)),
        type:       influenceResult.relation[i] > 0 ? "Cause" : "Effect",
        fill:       influenceResult.relation[i] > 0 ? "#d32f2f" : "#1e88e5",
      }))
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <header
        style={{
          height: "64px",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "0 20px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 22 }}>
            Hybrid MCDM Decision Support System for Restaurant Innovation
          </div>
          <button
            onClick={() => setShowReferenceModal(true)}
            style={{
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#1e3a8a",
              borderRadius: "999px",
              padding: "7px 14px",
              fontWeight: 600,
            }}
            title="Open reference paper information"
          >
            Help: Reference Paper
          </button>
        </div>
      </header>

      {showReferenceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            padding: "16px",
          }}
          onClick={() => setShowReferenceModal(false)}
        >
          <div
            style={{
              width: "min(680px, 100%)",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 30px -12px rgba(15, 23, 42, 0.35)",
              padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, textAlign: "left", color: "#0f172a" }}>Reference Paper</h2>
              <button
                onClick={() => setShowReferenceModal(false)}
                style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", backgroundColor: "#fff" }}
              >
                Close
              </button>
            </div>
            <p style={{ marginTop: "12px", marginBottom: 0 }}>
              This system is mainly based on the model from Chen (2022). Please read the paper for full methodological context before interpreting the results.
            </p>
            <a
              href={encodeURI(referencePaperPath)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: "12px", fontWeight: 700, color: "#0c4a6e" }}
              title="Open reference paper (PDF)"
            >
              Read the Reference PDF
            </a>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "1240px", margin: "22px auto", padding: "0 20px 28px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "4px",
                backgroundColor: "#e2e8f0",
                borderRadius: "999px",
                gap: "4px",
              }}
            >
              <button
                onClick={() => setActiveTab("input")}
                style={{
                  borderRadius: "999px",
                  border: "1px solid transparent",
                  backgroundColor: activeTab === "input" ? "#ffffff" : "transparent",
                  color: activeTab === "input" ? "#0f172a" : "#475569",
                  boxShadow: activeTab === "input" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  fontWeight: activeTab === "input" ? 700 : 600,
                }}
              >
                Input Matrix
              </button>
              <button
                onClick={() => setActiveTab("influence")}
                style={{
                  borderRadius: "999px",
                  border: "1px solid transparent",
                  backgroundColor: activeTab === "influence" ? "#ffffff" : "transparent",
                  color: activeTab === "influence" ? "#0f172a" : "#475569",
                  boxShadow: activeTab === "influence" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  fontWeight: activeTab === "influence" ? 700 : 600,
                }}
              >
                Influence Analysis
              </button>
              <button
                onClick={() => setActiveTab("priority")}
                style={{
                  borderRadius: "999px",
                  border: "1px solid transparent",
                  backgroundColor: activeTab === "priority" ? "#ffffff" : "transparent",
                  color: activeTab === "priority" ? "#0f172a" : "#475569",
                  boxShadow: activeTab === "priority" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  fontWeight: activeTab === "priority" ? 700 : 600,
                }}
              >
                Priority Ranking
              </button>
            </div>
          </div>

      {activeTab === "input" && (
        <>
          <ModeSelector matrixMode={matrixMode} onModeChange={handleModeChange} />

          <MatrixInputTable
            labels={labels}
            matrix={matrix}
            onChange={handleCellChange}
            onAnalyze={handleAnalyze}
            onLoadExample={handleLoadExample}
            onClear={handleReset}
            loading={loading}
            error={matrixError}
          />
        </>
      )}

      {activeTab === "influence" && (
        <>
          {/* ── Info banner ── */}
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderLeft: "4px solid #2563eb",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <p style={{ margin: 0, color: "#1e3a8a", fontSize: 14, fontWeight: 500 }}>
              Compute and investigate cause-and-effect relationships and correlations of the affiliated restaurants' core resources and impact indicators.
            </p>
          </div>

          {/* ── Mode segmented control ── */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-flex",
                padding: "4px",
                backgroundColor: "#e2e8f0",
                borderRadius: "999px",
                gap: "4px",
              }}
            >
              {[
                { key: "4x4", label: "Dimensions" },
                { key: "8x8", label: "Indicators" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setInfluenceMode(key)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid transparent",
                    backgroundColor: influenceMode === key ? "#ffffff" : "transparent",
                    color: influenceMode === key ? "#0f172a" : "#475569",
                    boxShadow: influenceMode === key ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                    fontWeight: influenceMode === key ? 700 : 500,
                    fontSize: 14,
                    padding: "7px 22px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {influenceResult ? (
            <>
              <TotalInfluenceTable labels={influenceLabels} result={influenceResult} matrixMode={influenceMode} />
              <ProminenceRelationTable labels={influenceLabels} result={influenceResult} matrixMode={influenceMode} />
              <CauseEffectDiagram
                scatterData={scatterData}
                matrixMode={influenceMode}
                dotPositionsRef={dotPositionsRef}
                dotPositions={dotPositions}
                setDotPositions={setDotPositions}
              />
              <GapAnalysis result={influenceResult} labels={influenceLabels} matrixMode={influenceMode} />
            </>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                padding: "48px 24px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: "12px" }}>🔍</div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: 18, margin: "0 0 8px 0", textAlign: "center" }}>
                {influenceMode === "4x4" ? "No Dimension Analysis Yet" : "No Indicator Analysis Yet"}
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Go to <strong>Input Matrix</strong>, fill in the{" "}
                {influenceMode === "4x4" ? "4×4 Dimensions" : "8×8 Indicators"} values, then click{" "}
                <strong>Analyze</strong>.
              </p>
              <button
                onClick={() => setActiveTab("input")}
                style={{
                  marginTop: "20px",
                  padding: "9px 24px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
                }}
              >
                Go to Input Matrix
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === "priority" && (
        <>
          {/* ── Info banner ── */}
          <div
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderLeft: "4px solid #2563eb",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: 18 }}>🏆</span>
            <p style={{ margin: 0, color: "#1e3a8a", fontSize: 14, fontWeight: 500 }}>
              Construct Affiliated Restaurants’ Core Resources and Impact Indicators and to Conduct the Analysis of Weights as Well as the Importance of Priority Rankings.
            </p>
          </div>

          <DimensionWeightReferenceTable result4x4={result4x4} result8x8={result8x8} />

          {result8x8 ? (
            <>
              <WeightRankingTable result={result8x8} />
              <RadarAnalysis result={result8x8} matrixMode="8x8" result4x4={result4x4} />
              <DanpInterpretation result8x8={result8x8} />
            </>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                padding: "48px 24px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: "12px" }}>🏆</div>
              <h2 style={{ color: "#0f172a", fontWeight: 700, fontSize: 18, margin: "0 0 8px 0", textAlign: "center" }}>
                No Priority Ranking Yet
              </h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                Go to <strong>Input Matrix</strong>, complete the{" "}
                <strong>8×8 Indicators</strong> matrix, then click <strong>Analyze</strong>.
              </p>
              <button
                onClick={() => setActiveTab("input")}
                style={{
                  marginTop: "20px",
                  padding: "9px 24px",
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
                }}
              >
                Go to Input Matrix
              </button>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}

export default App;
