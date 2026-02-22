# Frontend - React + Vite

Interactive UI for DEMATEL & DANP decision analysis with data visualizations.

**Stack:** React 19 + Vite + Axios + Recharts

## 🚀 Setup

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Code linting
```
▶️ `http://localhost:5173`

## 📁 Structure

```
src/
├── main.jsx      # React entry point
├── App.jsx       # Main app (matrix input + visualizations)
└── index.css     # Global styles
```

## 🎨 Features

| Component | Description |
|-----------|-------------|
| **Matrix Input** | 4×4 grid, numerical input (0-4), real-time state |
| **Influence Table** | Total influence matrix (T) displayed as table |
| **Cause-Effect Plot** | Scatter chart: X=Prominence (D+R), Y=Relation (D-R) |
| **Weight Ranking** | DANP weights sorted by priority |

### Cause-Effect Diagram
- **Above y=0 line** → Cause factors (drive others)
- **Below y=0 line** → Effect factors (driven by others)

## 📊 App.jsx State

```javascript
const [matrix, setMatrix] = useState(4×4 array)   // User input
const [result, setResult] = useState(null)         // API response
const [loading, setLoading] = useState(false)      // Request status
```

**Key Functions:**
- `handleChange(i, j, value)` - Update matrix cell
- `analyze()` - POST to `/analyze` endpoint
- Scatter data transformation for Recharts
