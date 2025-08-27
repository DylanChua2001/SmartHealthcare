# SmartHealthcare

This is a monorepo containing:

- **Frontend**: Next.js (in `frontend/my-app`)
- **Backend**: FastAPI (in `backend/app` with Vercel entrypoint in `backend/api`)

---

## Getting Started (Local Development)

### 1. Clone & setup
```bash
git clone https://github.com/DylanChua2001/SmartHealthcare.git
cd SmartHealthcare
```

### 2. Frontend (Next.js)
Install & run (dev)
```bash
cd frontend/my-app
npm install
npm run dev
```
App runs at http://localhost:3000

### 3. Backend (FastAPI)
Create & activate venv
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```
Install deps
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
Run (dev)
```bash
python -m uvicorn app.main:app --reload
```
API runs at http://127.0.0.1:8000
