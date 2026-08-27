# PathwayGH - AI-Powered Education & Career Ecosystem for Ghanaian Students

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)

**PathwayGH** helps Ghanaian students discover career paths, take courses with video lessons, practice with quizzes, and plan their studies based on their interests, subjects, and WASSCE grades.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/ZziemWellu/pathwaygh-mvp.git
cd pathwaygh-mvp

# Backend (Python 3.11)
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Set DATABASE_URL (Postgres) in backend/.env, then run migrations:
alembic upgrade head
python -m uvicorn main:app --reload --port 8001

# Frontend (React - new terminal)
cd frontend
npm install
npm run dev
```
Visit: http://localhost:5173

## Features

- 🎬 **Learn** - Courses with video lessons (YouTube/Vimeo) and progress tracking
- 🔍 **Explore** - Career search and university programme finder
- 📊 **WASSCE Eligibility Checker**
- 📝 **Practice** - Subject quizzes with scored history
- 📅 **Plan** - Study plans and roadmaps
- 👤 **Profile** - Student profiles with saved careers/universities/scholarships

## Architecture

- **Backend**: FastAPI + SQLAlchemy + Alembic + Postgres, JWT auth (`backend/`)
- **Frontend**: React 18 + Vite + react-router-dom (`frontend/`)
- Nineteen feature modules live under `backend/modules/`; most are early scaffolding (return placeholder data) except `auth`, `learn`, `practice`, `profile`, `plan`, and `explore`, which are backed by the real database.

## License
MIT
