# PathwayGH - AI-Powered Education & Career Ecosystem for Ghanaian Students

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org)

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
- 🎓 **Certificates** - Verifiable course-completion certificates, checkable while logged out
- 🏫 **School Admin** - Self-service school creation, join-code enrollment, per-class roster and completion reporting
- 📈 **Impact Dashboard** - Platform-wide completion/quiz-score trends by school and country, exportable as CSV
- 🤖 **AI Tutor** - Gemini-backed chat grounded in course content, with Socratic hints and deterministic math checking
- 💬 **WhatsApp Digests** - Scheduled progress summaries sent to parents/guardians and school admins

## Architecture

- **Backend**: FastAPI + SQLAlchemy + Alembic + Postgres, JWT auth (`backend/`)
- **Frontend**: React 19 + Vite + react-router-dom (`frontend/`)
- Twenty-one feature modules live under `backend/modules/`. Thirteen are real, backed by the database (or, for `explore`, curated JSON content): `auth`, `learn`, `practice`, `profile`, `plan`, `explore`, `admin`, `certificates`, `dashboard`, `impact`, `parent`, `school`, `tutor`. The remaining eight are still early scaffolding that return hardcoded placeholder data: `activity`, `analytics`, `community`, `knowledge_graph`, `live`, `paths`, `payment`, `recommendations`.

## License
MIT
