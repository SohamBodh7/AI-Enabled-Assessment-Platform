# 🎓 AI-Enabled Assessment Platform

A full-stack web application for conducting and managing online assessments with AI-powered features, real-time proctoring, and role-based dashboards for **Admins**, **Faculty**, and **Students**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 AI Question Generation | Auto-generate exam questions using AI |
| 🧑‍💻 Code Execution | In-browser code editor with live execution (Monaco Editor) |
| 🔒 Proctoring | Real-time monitoring via webcam & tab-switch detection |
| 👥 Role-based Access | Separate dashboards for Admin, Faculty, and Student |
| 📊 Result Analytics | Instant grading and performance insights |
| 🔐 JWT Authentication | Secure login with token-based sessions |

---

## 🛠️ Tech Stack

**Backend**
- Python · Flask · Flask-SocketIO
- Flask-SQLAlchemy · MySQL (PyMySQL)
- Flask-JWT-Extended · OpenCV (proctoring)

**Frontend**
- React 19 · Vite · Tailwind CSS
- React Router · Axios · Socket.IO Client
- Monaco Editor · React Hot Toast

---

## 📁 Project Structure

```
AI-Enabled-Assessment-Platform/
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── models.py           # SQLAlchemy database models
│   ├── config.py           # App configuration
│   ├── socket_events.py    # Real-time socket handlers
│   ├── requirements.txt    # Python dependencies
│   ├── routes/             # API route blueprints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── admin.py        # Admin management
│   │   ├── faculty.py      # Faculty exam management
│   │   ├── student.py      # Student exam endpoints
│   │   ├── ai.py           # AI generation endpoints
│   │   └── monitor.py      # Proctoring endpoints
│   ├── services/           # Business logic services
│   │   ├── code_executor.py
│   │   └── proctoring.py
│   └── utils/              # Shared utilities
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/     # Reusable UI components
        ├── context/        # React context providers
        ├── pages/          # Route-level page components
        │   ├── admin/
        │   ├── faculty/
        │   └── student/
        └── services/       # Axios API service layer
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL Server

### 1. Clone the Repository
```bash
git clone https://github.com/SohamBodh7/AI-Enabled-Assessment-Platform.git
cd AI-Enabled-Assessment-Platform
```

### 2. Backend Setup
```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with the following:
# DATABASE_URL=mysql+pymysql://user:password@localhost/db_name
# JWT_SECRET_KEY=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key   (for AI features)

# Run the server
python app.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (backend API).

---

## 👤 User Roles

- **Admin** — Manage users, monitor platform activity
- **Faculty** — Create exams, view submissions and analytics
- **Student** — Take exams, view results and performance

---

## 📄 License

This project is developed as part of an academic curriculum (Sem IV). All rights reserved.
