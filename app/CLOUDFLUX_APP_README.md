# CloudFlux Application

Full-stack application source:
- React frontend
- Flask backend API
- PostgreSQL database schema

> Note: this file is the original app-only README from the source drop.
> Docker, Kubernetes/Helm, Terraform, and GitHub Actions wiring for this app
> now live in the rest of this repo — see the top-level `README.md` and
> `docs/architecture.md` for how it's deployed.

## Local prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 15+

## 1. Database

Create a PostgreSQL database named `cloudflux`.

Run:

psql -U postgres -d cloudflux -f backend/db/schema.sql

## 2. Backend

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

Set environment variables:
DATABASE_URL=postgresql://postgres:password@localhost:5432/cloudflux
JWT_SECRET=change-this-in-production

Run:
python app.py

Backend:
http://localhost:5000

## 3. Frontend

cd frontend
npm install
npm run dev

Frontend:
http://localhost:5173

The frontend expects the backend at:
http://localhost:5000

Change VITE_API_URL if your backend runs elsewhere.
