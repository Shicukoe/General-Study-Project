# Frontend - React + Vite

Interactive UI for DEMATEL + DANP analysis with matrix input, influence visualization, ranking, benchmark comparison, and optional local AI interpretation.

**Stack:** React 19 + Vite 7 + Axios + Recharts

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm 10+
- Backend running on `http://localhost:8000` for local development

## Setup

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```

Open `http://localhost:5173`.

## API Configuration

The frontend reads the API base URL from `VITE_API_URL`.

- If `VITE_API_URL` is set, requests go to that URL.
- If not set, requests default to `/api`.
- In development, Vite proxy forwards `/api/*` to `http://localhost:8000/*`.

Example `.env`:

```bash
VITE_API_URL=https://your-backend.example.com
```

## Current App Behavior

The app has three main tabs:

1. **Input Matrix**
	- Supports both 4x4 (Dimensions) and 8x8 (Indicators) matrices.
	- Validates all off-diagonal cells (`0..4`) and blocks empty/invalid/all-zero inputs.
	- Includes `Load Example`, `Analyze`, and `Clear` actions.
	- Analysis runs both 4x4 and 8x8 requests in parallel and stores separate results for each mode.

2. **Influence Analysis**
	- Displays Total Influence Matrix (T).
	- Displays Prominence/Relation table (`D`, `R`, `D+R`, `D-R`).
	- Shows cause-effect scatter diagram with arrow overlays.
	- Includes benchmark comparison against paper values and optional AI-generated gap insight.

3. **Priority Ranking**
	- Shows computed dimension distribution and priority.
	- Displays 8x8 DANP ranking table.
	- Displays radar analysis for indicator weights.
	- Supports optional AI strategic interpretation for top-4 indicators.

## AI Features (Local Only)

The AI sections call backend endpoints that depend on Ollama:

- `POST /gap-analysis`
- `POST /interpret-danp`

These work locally when Ollama is installed and running with a model pulled. They are marked local-only and are not assumed to be available in deployed environments.

## Frontend File Structure

```text
src/
  main.jsx
  App.jsx
  constants.js
  utils.js
  components/
	 ModeSelector.jsx
	 MatrixInputTable.jsx
	 TotalInfluenceTable.jsx
	 ProminenceRelationTable.jsx
	 CauseEffectDiagram.jsx
	 ArrowOverlay.jsx
	 GapAnalysis.jsx
	 DimensionWeightReferenceTable.jsx
	 WeightRankingTable.jsx
	 RadarAnalysis.jsx
	 DanpInterpretation.jsx
```

`public/docs/` contains the reference paper PDF used by the in-app "Help: Reference Paper" modal.
