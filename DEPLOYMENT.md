# Deployment Guide

This project consists of a **React + Vite frontend** and a **FastAPI backend**. Both need to be deployed separately.

---

## **Option 1: Deploy Frontend to Vercel + Backend to Render (Recommended)**

### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```powershell
   npm i -g vercel
   ```

2. **Push to GitHub** (required for Vercel)
   ```powershell
   git add .
   git commit -m "Update API URL to use environment variables"
   git push
   ```

3. **Deploy to Vercel**
   ```powershell
   vercel
   ```
   - Select your GitHub repo
   - Framework preset: Vite
   - Root directory: `./`

4. **Set Environment Variable in Vercel Dashboard**
   - Go to your Vercel project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.onrender.com` (or wherever backend is deployed)

---

### Backend Deployment (Render)

1. **Create `render.yaml`** at project root:
   ```yaml
   services:
     - type: web
       name: hospitality-dss-api
       runtime: python
       buildCommand: pip install -r backend/requirements.txt
       startCommand: uvicorn app.main:app --host 0.0.0.0 --port 8000
       envVars:
         - key: PYTHONPATH
           value: backend
       rootDir: backend
   ```

2. **Push to GitHub**
   ```powershell
   git add render.yaml
   git commit -m "Add Render deployment config"
   git push
   ```

3. **Deploy on Render.com**
   - Go to [render.com](https://render.com)
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repo
   - Render will auto-detect `render.yaml`
   - Deploy

4. **Get Backend URL** (after deployment completes)
   - Copy your Render service URL (e.g., `https://hospitality-dss-api.onrender.com`)

5. **Update Vercel Environment Variables**
   - In Vercel dashboard, set `VITE_API_URL` to your Render backend URL
   - Redeploy frontend

---

## **Option 2: Deploy Both to Vercel (Python Serverless)**

Advanced setup using Vercel's Python runtime.

1. **Create `api/index.py`** at project root:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   from mangum import Mangum
   import sys
   import os
   
   sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
   
   from app.main import app
   
   # CORS already configured in backend/app/main.py
   handler = Mangum(app)
   ```

2. **Update `backend/requirements.txt`**
   ```
   fastapi==0.104.1
   uvicorn[standard]==0.24.0
   mangum==0.17.0
   numpy==1.24.3
   pytest==7.4.3
   pytest-cov==4.1.0
   ```

3. **Update `vercel.json`**
   ```json
   {
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/dist",
     "installCommand": "cd frontend && npm install",
     "env": {
       "VITE_API_URL": "@api_url"
     }
   }
   ```

4. **Deploy**
   ```powershell
   vercel
   ```

---

## **Local Development**

1. **Backend**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python run.py
   ```

2. **Frontend** (new terminal)
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Access at `http://localhost:5173`

---

## **Environment Variables**

### Frontend (`.env.local` or Vercel dashboard)
```
VITE_API_URL=https://your-backend-url.com
```

### Backend
- None required for basic setup
- Can add: `DEBUG=False`, `CORS_ORIGINS=https://your-frontend-url.com` (if needed)

---

## **Recommended Approach**

Use **Option 1** (Vercel + Render):
- ✅ Simple to set up
- ✅ Render has free tier for Python
- ✅ Better performance (separate scaling)
- ✅ Easier debugging

Choose **Option 2** only if you need everything in one Vercel account and are comfortable with serverless Python.
