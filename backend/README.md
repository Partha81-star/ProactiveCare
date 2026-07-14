# MediConnect AI — Backend (Core CRUD: Patients, Doctors, Appointments)

This is the first backend scaffold. It gives you working CRUD APIs backed by
PostgreSQL. Auth, AI, and Notifications will be added in later passes.

---

## 1. Install PostgreSQL (Windows)

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run it. During setup:
   - Remember the password you set for the `postgres` user — you'll need it below.
   - Keep the default port `5432`.
3. After install, open **pgAdmin** (installed alongside PostgreSQL) or use the
   command line tool `psql` to create a database:

   Using psql (Start Menu → "SQL Shell (psql)"):
   ```
   -- Press Enter to accept defaults until it asks for a password, then type the password you set.
   CREATE DATABASE mediconnect;
   ```

---

## 2. Set up the Python environment

Open **PowerShell** or **Command Prompt** in this project folder and run:

```powershell
# Create a virtual environment (keeps this project's Python packages isolated)
python -m venv venv

# Activate it
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

If `python` isn't recognized, install Python 3.11+ from https://www.python.org/downloads/
and make sure to check "Add Python to PATH" during installation.

---

## 3. Configure your database connection

1. Copy `.env.example` to a new file named `.env`
2. Open `.env` and replace `YOUR_PASSWORD_HERE` with the PostgreSQL password
   you set in Step 1.

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/mediconnect
```

---

## 4. Run the server

```powershell
uvicorn app.main:app --reload
```

You should see output ending with something like:
```
Uvicorn running on http://127.0.0.1:8000
```

The `--reload` flag auto-restarts the server whenever you edit a file — useful during development.

---

## 5. Test the API

Open your browser to:

```
http://127.0.0.1:8000/docs
```

This is FastAPI's auto-generated interactive documentation (Swagger UI). You can:
- Try out every endpoint directly from the browser
- See required fields for each request
- View example responses

The tables (`patients`, `doctors`, `appointments`) are created automatically
in PostgreSQL the first time you run the server.

---

## 6. Project structure explained

```
app/
├── main.py           # App entrypoint — starts the server, registers routes
├── database.py        # DB connection setup
├── models/            # SQLAlchemy models = database table definitions
├── schemas/            # Pydantic schemas = API input/output validation
├── crud/                # Actual database operations (create/read/update/delete)
└── routers/               # API endpoint definitions (URLs + HTTP methods)
```

**Why split into models / schemas / crud / routers?**
This is a standard FastAPI pattern that keeps responsibilities separate:
- A **router** handles the HTTP request/response.
- It calls a **crud** function to talk to the database.
- The crud function uses a **model** to know the table structure.
- Data going in/out is validated by a **schema**.

This makes the code easier to test, extend, and hand off between team members —
e.g., your AI teammate can later import from `app.models.patient` without
touching your router code at all.

---

## 7. What's next (not included in this scaffold)

- JWT Authentication + role-based access (Admin/Doctor/Patient)
- Alembic migrations (instead of `create_all`) once schema stabilizes
- Notification module (SMS/WhatsApp/Email)
- AI Engine integration (Gemini API)
- Docker setup for deployment

Let me know when you're ready for the next module and we'll build it the same way.
