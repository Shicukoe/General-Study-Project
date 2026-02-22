# DEMATEL + DANP Decision Support System

Multi-criteria decision analysis for hospitality business innovation.

**Stack:** FastAPI + React + Vite + NumPy + Recharts  
**Reference:** [Chen et al. (2022)](https://onlinelibrary.wiley.com/doi/10.1155/2022/9527219)

---

## Quick Start

**Prerequisites:** Python 3.8+ | Node.js 16+

### Manual Setup

**Backend (Terminal 1):**
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1    # Windows PowerShell
# OR: venv\Scripts\activate.bat # Windows CMD
# OR: source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
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

- **4×4 & 8×8 Matrix Modes** - Toggle between dimension and indicator analysis
- **Domain Labels** - Tangible/Intangible assets, resource types
- **Heatmap** - Visual intensity of relationships
- **Cause-Effect Diagram** - Scatter plot analysis
- **DANP Ranking** - Priority-ordered factor weights

---

## Documentation

- **Setup Guide:** This README
- **Quick Commands:** [QUICKSTART.md](QUICKSTART.md)
- **Testing:** [backend/README_TESTS.md](backend/README_TESTS.md)

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
