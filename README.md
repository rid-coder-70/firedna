# FireDNA

FireDNA is a full-stack NASA FIRMS active-fire data dashboard. The backend provides ingestion, harmonization, analytics, anomaly, and export APIs; the Next.js frontend includes the map, comparison, calendar, and analytics views.

## Run locally (Windows PowerShell)

Use two terminals from the repository root.

### Backend

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure `backend\.env` (start from `.env.example` if needed). Leave `FIRMS_MAP_KEY` empty for demo mode, which generates synthetic data. To populate the local database and compute the demo harmonization and anomalies:

```powershell
python -m app.utils.seed_demo_data
```

Start the API:

```powershell
python -m uvicorn app.main:app --reload
```

The API is at <http://localhost:8000>; interactive documentation is at <http://localhost:8000/docs>.

### Frontend

```powershell
Set-Location .\frontend
npm ci
npm run dev
```

Open <http://localhost:3000>. The frontend uses `http://localhost:8000/api/v1` by default; set `NEXT_PUBLIC_API_URL` before building if the API is hosted elsewhere.

## Tests and production build

```powershell
Set-Location .\backend
python tests\run_tests.py
```

```powershell
Set-Location .\frontend
npm run build
```

## Docker Compose

With Docker Desktop installed, set a PostgreSQL password and optionally a NASA FIRMS key, then run Compose from the repository root:

```powershell
$env:POSTGRES_PASSWORD = "choose-a-local-password"
$env:FIRMS_MAP_KEY = ""
docker compose up --build
```

Compose starts PostgreSQL/PostGIS, the API, and the frontend. Without `FIRMS_MAP_KEY`, the backend uses demo mode.
