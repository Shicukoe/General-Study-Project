# DEMATEL + DANP Decision Support System

Hybrid MCDM Decision Support System for Restaurant Innovation


**Stack:** FastAPI + React 19 + Vite + NumPy + Recharts + Axios + Ollama (LLM)  
**Reference:** [Chen et al. (2022)](https://onlinelibrary.wiley.com/doi/10.1155/2022/9527219)
**Simulated Website:** https://general-study-project-3ueg.vercel.app/  

---

## Quick Start

**Prerequisites:** Python 3.10+ | Node.js 16+

### Manual Setup

**Backend (Terminal 1):**
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows PowerShell
# OR: venv\Scripts\activate.bat # Windows CMD
# OR: source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt

# Install AI Agent Ollama 
irm https://ollama.com/install.ps1 | iex
ollama pull llama3

# Run the backend
python run.py
```
▶️ http://127.0.0.1:8000

**Frontend (Terminal 2 - New Window):**
```bash
cd frontend
npm install
npm run dev
```
▶️ http://localhost:5173

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| PowerShell blocks script | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| `python not recognized` | Install from [python.org](https://python.org), restart terminal |
| `npm not recognized` | Install from [nodejs.org](https://nodejs.org), restart terminal |
| Port 8000 in use | Change port in `backend/run.py` |
| Backend error | Verify running at `http://127.0.0.1:8000/docs` |

---

## Features

- **4×4 & 8×8 Matrix Modes** - Toggle between 4 dimension labels (Tangible/Intangible assets, Personal/Organizational ability) and 8 indicator labels from the paper
- **Matrix Input** - Editable influence matrix with example data pre-loaded from Chen et al. (2022)
- **Total Influence Matrix** - Computed T matrix displayed as a formatted table
- **Prominence & Relation Table** - D, R, D+R, D−R values per factor
- **Cause-Effect Diagram** - Scatter plot of prominence vs. relation with arrow overlay
- **DANP Weight Ranking** - Priority-ordered factor weights via limit matrix convergence
- **Radar Analysis** - Radar chart of DANP weights across factors
- **Gap Analysis** - Compares user results against the expert benchmark (16 practitioners) from the reference paper
- **Dimension Weight Reference Table** - Paper Table 10 benchmark weights for reflection
- **AI Interpretation Report** *(local only — not yet deployed)* - Ollama LLM generates a strategic report for the top-4 DANP indicators (`/interpret-danp`)
- **Gap Analysis AI Report** *(local only — not yet deployed)* - Ollama LLM compares user cause/effect results to expert benchmark (`/gap-analysis`)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Health check (JSON status) |
| POST | `/analyze` | Run DEMATEL + DANP on a matrix |
| POST | `/gap-analysis` | Compare results to paper benchmark + AI report |
| POST | `/interpret-danp` | Generate AI strategic report for top-4 DANP indicators |

---

## Ollama NLP Features (Local Only)

> ⚠️ **Not yet deployed.** These AI features currently run locally only. They require Ollama to be installed and running on the same machine as the backend.

The backend integrates with [Ollama](https://ollama.com) to generate natural-language strategic interpretations of DEMATEL/DANP results.

**Install Ollama and pull model**
```bash
irm https://ollama.com/install.ps1 | iex
ollama pull llama3
```


**Install Python dependencies** (already in `requirements.txt`):
```bash
pip install httpx pydantic
```

**How it works:**
- The backend auto-detects models available in Ollama (`llama3.2`, `llama3.1`, `llama3`, `qwen2.5`, `mistral`, `phi3` in priority order)
- If Ollama is not running, all other analysis features still work normally — AI reports are simply skipped
- Override the default model via the `OLLAMA_MODEL` environment variable
- Override the Ollama host via `OLLAMA_HOST` (default: `http://localhost:11434`)

---

## Documentation

- **Setup Guide:** This README
- **Quick Commands:** [QUICKSTART.md](QUICKSTART.md)
- **Testing:** [backend/README.md](backend/README.md)

---

## Testing

```bash
cd backend
pip install pytest
pytest test_cases.py -v
# OR on Windows:
run_tests.bat
```

---

**Status:** ✅ Production-Ready | **Tests:** 23
