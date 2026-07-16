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

## 4. Set up the database tables (Alembic)

This project uses **Alembic** to manage database tables instead of auto-creating
them on startup. This means you need to run one command before starting the
server for the first time:

```powershell
alembic upgrade head
```

This reads the migration files in `migrations/versions/` and creates the
`patients`, `doctors`, and `appointments` tables in your PostgreSQL database.

**When do I need to run this again?**
Any time you `git pull` and someone (including you) has added a new Alembic
migration file (e.g. after Auth adds a `users` table). Run `alembic upgrade head`
again to bring your local database up to date.

**If you ever change a model** (e.g. add a new column to `Patient`), generate
a new migration with:
```powershell
alembic revision --autogenerate -m "short description of the change"
alembic upgrade head
```
Then commit the new file that appears in `migrations/versions/` along with
your model change — this keeps the whole team's database schema in sync.

---

## 5. Run the server

```powershell
uvicorn app.main:app --reload
```

You should see output ending with something like:
```
Uvicorn running on http://127.0.0.1:8000
```

The `--reload` flag auto-restarts the server whenever you edit a file — useful during development.

---

## 6. Test the API

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

## 7. Project structure explained

```
backend/
├── app/
│   ├── main.py           # App entrypoint — starts the server, registers routes
│   ├── database.py        # DB connection setup
│   ├── models/            # SQLAlchemy models = database table definitions
│   ├── schemas/            # Pydantic schemas = API input/output validation
│   ├── crud/                # Actual database operations (create/read/update/delete)
│   └── routers/               # API endpoint definitions (URLs + HTTP methods)
├── migrations/            # Alembic migration files (database version history)
│   ├── env.py               # Tells Alembic how to connect + which models to track
│   └── versions/               # Each file here = one database change, in order
└── alembic.ini              # Alembic configuration file
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

## 8b. Medical Reports & Prescriptions (new)

**Medical Reports** now support real file uploads (PDF, JPG, PNG):
- `POST /medical-reports/upload` — multipart form: `patient_id`, `doctor_id`, `report_type`, `report_date`, `status`, `notes`, and the `file` itself
- `GET /medical-reports/{id}/download` — downloads the original file back
- Files are stored on disk under `backend/uploads/medical_reports/` — this folder is git-ignored (see `.gitignore`), so files stay local to each machine and never get pushed to the repo
- Deleting a report also deletes its file from disk automatically

**Prescriptions** use a header + items structure — one prescription can hold multiple medicines:
- `POST /prescriptions/` — send patient/doctor info plus an `items` list of medicines in one request (see `schemas/prescription.py` for the exact shape)
- `POST /prescriptions/{id}/items` — add one more medicine to an existing prescription
- `DELETE /prescriptions/{id}/items/{item_id}` — remove a single medicine
- Deleting a whole prescription automatically deletes all its medicine items too

Test both of these live at `/docs` — Swagger UI supports file upload testing directly in the browser (look for the "Choose File" button on the upload endpoint).

---

## 8c. Departments & Analytics (new)

**Departments** — standard CRUD, standalone table:
- `POST /departments/`, `GET /departments/`, `GET /departments/{id}`, `PUT /departments/{id}`, `DELETE /departments/{id}`
- **Note:** this is intentionally NOT linked to `Doctor.department` (which stays free text) — that was a deliberate decision to avoid a breaking change to the existing Doctor table right now. Departments is a standalone list for Admin to manage; it doesn't yet constrain what doctors can enter as their department.

**Analytics** — one read-only endpoint powering the dashboard:
- `GET /analytics/summary` — returns everything in one response:
  - `total_patients`, `total_doctors`, `total_departments`
  - `total_appointments` + `appointments_by_status` (e.g. `{"Scheduled": 2, "Completed": 1}`)
  - `appointments_by_department` — grouped by `Doctor.department` text field
  - `total_medical_reports`, `total_prescriptions`

Tested live with real sample data (2 departments, 2 doctors, 2 patients, 3 appointments) — all counts and groupings verified correct before shipping.

---

## 9. What's next (not included in this scaffold)

- ~~Alembic migrations~~ ✅ Done
- Auth is not planned for this phase (handled separately by the team)
- Notification module (SMS/WhatsApp/Email) — being built by Parth in `ai_notification_service/`
- Docker setup for deployment

Let me know when you're ready for the next module and we'll build it the same way.
