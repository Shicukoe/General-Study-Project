# Quick Start

**Prerequisites:** Python 3.8+ & Node.js 16+

## Manual Setup

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
# OR: venv\Scripts\activate.bat # Windows CMD
# OR: source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python run.py
```
▶️ http://127.0.0.1:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```
▶️ http://localhost:5173

---

**First-time setup note:**  
If PowerShell blocks scripts, run once:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**More help:** See [README.md](README.md) for troubleshooting
