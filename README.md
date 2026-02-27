# PrepPulse — AI-Powered Placement Preparation Platform

PrepPulse is a full-stack web application that helps students prepare for campus placements with AI-driven tools including a chatbot assistant, resume analyzer, mock test tracker, habit builder, and a skill progress dashboard.

---

## Features

- **AI Chatbot** — Powered by OpenAI GPT-4o-mini for personalized placement prep advice, study plans, and interview tips (with text-to-speech support).
- **Resume Analyzer** — Upload PDF/DOCX resumes and get an AI-generated ATS score, strengths & weaknesses breakdown, and improvement suggestions.
- **Mock Test Tracker** — Log mock tests from any source, track scores, and monitor improvement over time.
- **Skill Checklist** — Self-assess technical skills and track progress across categories.
- **Habit Tracker** — Build daily study habits with a visual streak and completion tracker.
- **Progress Dashboard** — View onboarding readiness score, leaderboard, and overall placement readiness.
- **Onboarding Flow** — First-time users complete a guided self-assessment to personalize their dashboard.
- **Admin Panel** — Full admin interface with user management, database explorer, and analytics.
- **Auth System** — Registration, login, password reset via email with secure token links.

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Backend     | Python, Flask                       |
| Database    | SQLite                              |
| AI / LLM    | OpenAI API (GPT-4o-mini, TTS)      |
| Frontend    | HTML, CSS, JavaScript (vanilla)     |
| Email       | SMTP (Gmail or any provider)        |
| Resume Parse| PyPDF2, python-docx                 |

---

## Project Structure

```
AITAM/
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
├── app/
│   ├── __init__.py         # Flask app factory & config
│   ├── db.py               # SQLite database layer (schema + CRUD)
│   ├── email_utils.py      # SMTP email helper
│   ├── routes.py           # All route handlers & API endpoints
│   ├── static/
│   │   ├── css/            # Stylesheets (auth, dashboard, resume, admin, etc.)
│   │   └── js/             # Client-side scripts (chatbot, mock tests, resume, etc.)
│   └── templates/          # Jinja2 HTML templates
└── data/
    └── resumes/            # Uploaded user resumes (per-email folders)
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- An OpenAI API key (for chatbot & resume analysis)
- SMTP credentials (for password reset emails — optional for local dev)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd AITAM

# Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the project root (or set these in your environment):

```env
SECRET_KEY=your-secret-key
OPEN_API_KEY=sk-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
```

### Run the App

```bash
python run.py
```

The server starts at **http://127.0.0.1:5000**.

---

## API Overview

| Endpoint                        | Method       | Description                    |
| ------------------------------- | ------------ | ------------------------------ |
| `/`                             | GET          | Landing page                   |
| `/login`                        | GET / POST   | User login                     |
| `/register`                     | GET / POST   | User registration              |
| `/forgot-password`              | GET / POST   | Request password reset email   |
| `/reset-password/<token>`       | GET / POST   | Reset password via token       |
| `/onboarding`                   | GET / POST   | First-login self-assessment    |
| `/dashboard`                    | GET          | Main dashboard                 |
| `/chat`                         | POST         | AI chatbot conversation        |
| `/mock-tests`                   | GET          | Mock tests page                |
| `/api/mock-tests`               | GET / POST   | CRUD for mock test records     |
| `/api/mock-tests/<id>`          | PUT / DELETE | Update or delete a mock test   |
| `/progress`                     | GET          | Progress & habits page         |
| `/api/habits`                   | GET / POST   | Habit CRUD                     |
| `/api/habits/toggle`            | POST         | Toggle daily habit completion  |
| `/api/habits/logs`              | GET          | Retrieve habit log history     |
| `/api/leaderboard`              | GET          | Leaderboard data               |
| `/resume`                       | GET          | Resume analyzer page           |
| `/api/resume/upload`            | POST         | Upload a resume file           |
| `/api/resume/analyze`           | POST         | AI-powered resume analysis     |
| `/api/resume/latest`            | GET          | Get latest resume & analysis   |
| `/admin`                        | GET          | Admin panel                    |
| `/api/admin/*`                  | Various      | Admin user/table management    |
| `/api/health`                   | GET          | Health check                   |

---

## License

This project was built for a hackathon. All rights reserved.
