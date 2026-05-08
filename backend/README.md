# DLens Backend Setup Guide

This is the FastAPI backend for DLens. It does four jobs:

1. Stores users and login tokens in PostgreSQL.
2. Stores uploaded CSV/source connection metadata in MongoDB.
3. Runs profiling, shifting, and KDE jobs with PySpark.
4. Writes dashboard result tables back into PostgreSQL.

This guide is intentionally very step-by-step. Follow it top to bottom the first time.

## 0. Where To Run Commands

Open PowerShell in the repository root:

```powershell
cd C:\Lappy\Swapnil\ByteIQ\Dlens\Dlens_BE_updated
```

Most backend commands should be run from:

```powershell
cd backend
```

The backend folder should look roughly like this:

```text
backend/
  app/                         FastAPI app
  services/                    Spark pipeline code
  uploaded_files/excel/        CSV uploads go here
  jars/                        PostgreSQL JDBC jar goes here
  hadoop/bin/                  winutils.exe goes here on Windows
  requirements.txt             Python packages
  .env.example                 Example environment file
  .env                         Your local environment file
  run_backend.ps1              Starts the backend
```

## 1. Install Required Software

You need these installed on Windows:

- Python 3.11
- PostgreSQL
- MongoDB, either local MongoDB Community Server or MongoDB Atlas
- Java JDK 17
- Node/frontend is separate and lives in `frontend/`

Check Python:

```powershell
python --version
```

Expected:

```text
Python 3.11.x
```

Check PostgreSQL command line:

```powershell
psql --version
```

If `psql` is not recognized, you can still use pgAdmin or SQL Shell from the Start Menu.

Check Java:

```powershell
java -version
echo $env:JAVA_HOME
```

Expected Java version is 17. Example:

```text
openjdk version "17.x"
C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
```

If `JAVA_HOME` is empty, set it in Windows Environment Variables and restart PowerShell.

## 2. Create A Clean Python Environment

From the repo root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks activation, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then try again:

```powershell
.\.venv\Scripts\Activate.ps1
```

If you previously saw dependency resolver warnings, the safest fix is to use this fresh `.venv`. Do not install into your global Python.

## 3. Create The `.env` File

From `backend/`:

```powershell
copy .env.example .env
```

Open `backend\.env` and edit the values.

For a simple local setup, it can look like this:

```env
FRONTEND_HOST=http://localhost:5173

AUTH_BYPASS=true
AUTH_BYPASS_USER_ID=1

SQLALCHEMY_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fastapi_auth

DB_HOST=localhost
DB_PORT=5432
DB_NAME=dq_destination7
DB_USER=postgres
DB_PASSWORD=postgres

mongo_cred=mongodb://localhost:27017

UPLOAD_DIRECTORY=uploaded_files/excel

JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
HADOOP_HOME=
POSTGRES_JDBC_JAR=
```

Change the password values if your PostgreSQL password is not `postgres`.

There are two PostgreSQL connection settings on purpose:

- `SQLALCHEMY_DATABASE_URL` points to the auth database.
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` point to the pipeline/dashboard database.

## 4. Create PostgreSQL Databases

DLens uses two PostgreSQL databases:

| Database | Purpose |
| --- | --- |
| `fastapi_auth` | Login users and auth tokens |
| `dq_destination7` | Profiling, shifting, KDE, and dashboard tables |

### Option A: Using pgAdmin

1. Open pgAdmin.
2. Connect to your local PostgreSQL server.
3. Right-click `Databases`.
4. Create database named `fastapi_auth`.
5. Create database named `dq_destination7`.

### Option B: Using SQL Shell Or PowerShell

Run:

```powershell
psql -U postgres -c "CREATE DATABASE fastapi_auth;"
psql -U postgres -c "CREATE DATABASE dq_destination7;"
```

If either command says the database already exists, that is fine.

## 5. Create The One Table You May Want Before First Run

The backend creates most tables automatically, but creating the tracker table now makes `/master_table` predictable before your first pipeline run.

Run this against the `dq_destination7` database:

```powershell
psql -U postgres -d dq_destination7
```

Then paste:

```sql
CREATE TABLE IF NOT EXISTS public.processed_tables_tracker (
    table_name VARCHAR(255),
    schema_name VARCHAR(255),
    processed_date TIMESTAMP,
    is_active BOOLEAN DEFAULT false,
    user_id integer,
    source VARCHAR(255),
    time_taken DOUBLE PRECISION,
    PRIMARY KEY (table_name, user_id)
);
```

Exit `psql`:

```sql
\q
```

## 6. Tables Created Automatically

You do not normally create these by hand.

### Auth Tables

These are created in `fastapi_auth` when the backend starts:

- `users`
- `user_tokens`

The code that creates them is in `app/main.py`:

```python
models.Base.metadata.create_all(bind=engine)
```

### Dashboard Tables

These are created in `dq_destination7` when Spark runs and writes results.

Profiling tables:

- `table_meta_data`
- `table_column_meta`
- `table_num_profiling`
- `table_categorical_profiling`
- `table_date_profiling`

Shifting tables, created only when a valid date column is provided:

- `table_macroshift`
- `table_categorical_shift`
- `table_numeric_shift`
- `table_ds_index`
- `table_timeliness`

KDE tables, created only when a valid date column is provided:

- `kde_numerical_format`
- `kde_categorical_format`
- `kde_date_format`
- `kde_numerical_domain`
- `kde_categorical_domain`
- `kde_date_domain`
- `kde_completeness`
- `kde_trend`
- `kde_overall`

If you upload a CSV without a date column, that is allowed. The run creates profiling tables only. Shifting and KDE endpoints will return empty arrays instead of crashing.

## 7. MongoDB Setup

MongoDB stores source metadata, not dashboard data.

The code uses:

```text
Database:   Local_NEW
Collection: Source
```

You do not need to create these manually. MongoDB creates them the first time the backend inserts a source record.

For local MongoDB:

```env
mongo_cred=mongodb://localhost:27017
```

For MongoDB Atlas:

```env
mongo_cred=mongodb+srv://<username>:<password>@<cluster-url>/
```

After changing MongoDB settings, restart the backend.

## 8. Install Spark Runtime Extras For Windows

PySpark needs three extra things on Windows:

1. Java JDK 17
2. `winutils.exe`
3. PostgreSQL JDBC jar

From `backend/`, run:

```powershell
.\download_jdbc_drivers.ps1
.\download_windows_spark_tools.ps1
```

These scripts place files here:

```text
backend/jars/postgresql-*.jar
backend/hadoop/bin/winutils.exe
```

The backend health check looks for those files.

If you keep them somewhere else, set these in `.env`:

```env
HADOOP_HOME=C:\path\to\hadoop
POSTGRES_JDBC_JAR=C:\path\to\postgresql-42.7.4.jar
```

`HADOOP_HOME` must point to a folder that contains:

```text
bin/winutils.exe
```

After changing `JAVA_HOME`, `HADOOP_HOME`, or `POSTGRES_JDBC_JAR`, restart PowerShell and restart the backend.

## 9. Start The Backend

From `backend/`:

```powershell
.\run_backend.ps1
```

Or manually:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

## 10. Check If Setup Worked

Open:

```text
http://127.0.0.1:8000/health
```

Good result:

```json
{
  "status": "ok",
  "checks": {
    "api": { "status": "ok" },
    "auth_database": { "status": "ok" },
    "pipeline_database": { "status": "ok" },
    "mongo_database": { "status": "ok" },
    "upload_directory": { "status": "ok" },
    "java_runtime": { "status": "ok" },
    "hadoop_runtime": { "status": "ok" },
    "postgres_jdbc": { "status": "ok" }
  }
}
```

If status is `degraded`, read the failing check. The message usually says exactly what is missing.

Common failures:

| Health Check | Meaning | Fix |
| --- | --- | --- |
| `auth_database` | `fastapi_auth` connection failed | Check `SQLALCHEMY_DATABASE_URL` |
| `pipeline_database` | `dq_destination7` connection failed | Check `DB_*` values |
| `mongo_database` | MongoDB connection failed | Start MongoDB or fix `mongo_cred` |
| `java_runtime` | Java is not found | Install JDK 17 and set `JAVA_HOME` |
| `hadoop_runtime` | `winutils.exe` missing | Run `download_windows_spark_tools.ps1` |
| `postgres_jdbc` | Spark cannot find PostgreSQL driver | Run `download_jdbc_drivers.ps1` |

## 11. Start Frontend And Backend Together

From the repository root:

```powershell
.\start_dev.bat
```

This opens backend and frontend windows.

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://127.0.0.1:8000
```

## 12. First Real Test Run

1. Start PostgreSQL.
2. Start MongoDB.
3. Start backend.
4. Start frontend.
5. Open frontend:

```text
http://localhost:5173
```

6. Go to source upload:

```text
http://localhost:5173/csv
```

7. Upload a CSV.
8. Leave date column blank if you only want profiling.
9. Enter a valid date column if you want shifting and KDE.
10. Go to Connections.
11. Click `Start Process`.
12. Wait for the progress to complete.

After success, check:

```text
http://127.0.0.1:8000/master_table
```

You should see your processed table.

Then dashboards should use:

```text
http://127.0.0.1:8000/profiling/<table_name>
http://127.0.0.1:8000/shifting/<table_name>
http://127.0.0.1:8000/kde/<table_name>
```

## 13. Auth Bypass For Local Development

Local auth bypass is enabled by default:

```env
AUTH_BYPASS=true
AUTH_BYPASS_USER_ID=1
```

That means protected endpoints pretend the request belongs to user `1`.

This is useful while testing the pipeline.

To use real login:

```env
AUTH_BYPASS=false
```

Then:

1. Register with `POST /users/`.
2. Verify the user with email flow or manually set `is_active=true`.
3. Login with `POST /auth/login`.
4. Send `Authorization: Bearer <access_token>`.

For local development, bypass mode is simpler.

## 14. Supported Source Types Right Now

The backend currently supports:

- CSV upload through `/newupload`
- Postgres source setup through `/save_source`
- MySQL source setup through `/save_source`

The frontend may show other connectors as disabled placeholders. Do not expect Kafka, REST API, Excel, Oracle, Snowflake, etc. to work until backend connector logic is added for them.

## 15. Useful Endpoints

```text
GET  /health
GET  /master_table
POST /newupload
POST /save_source
POST /run-script
GET  /task/{task_id}
WS   /ws/{task_id}
GET  /profiling/{table_name}
GET  /shifting/{table_name}
GET  /kde/{table_name}
```

## 16. Resetting Local Data

If you want to wipe dashboard output and start over, run this on `dq_destination7`:

```sql
DROP TABLE IF EXISTS
  public.processed_tables_tracker,
  public.table_meta_data,
  public.table_column_meta,
  public.table_num_profiling,
  public.table_categorical_profiling,
  public.table_date_profiling,
  public.table_macroshift,
  public.table_categorical_shift,
  public.table_numeric_shift,
  public.table_ds_index,
  public.table_timeliness,
  public.kde_numerical_format,
  public.kde_categorical_format,
  public.kde_date_format,
  public.kde_numerical_domain,
  public.kde_categorical_domain,
  public.kde_date_domain,
  public.kde_completeness,
  public.kde_trend,
  public.kde_overall;
```

If you want to wipe auth users, run this on `fastapi_auth`:

```sql
DROP TABLE IF EXISTS public.user_tokens;
DROP TABLE IF EXISTS public.users;
```

The auth tables are recreated when the backend starts.

If you want to wipe Mongo source records, delete documents from:

```text
Local_NEW.Source
```

## 17. Common Errors

### `org.postgresql.Driver` not found

Spark cannot find the PostgreSQL JDBC jar.

Fix:

```powershell
cd backend
.\download_jdbc_drivers.ps1
```

Restart backend.

### `HADOOP_HOME and hadoop.home.dir are unset`

Spark on Windows needs `winutils.exe`.

Fix:

```powershell
cd backend
.\download_windows_spark_tools.ps1
```

Restart backend.

### Java not found

Install JDK 17, set `JAVA_HOME`, restart PowerShell, restart backend.

Check:

```powershell
java -version
echo $env:JAVA_HOME
```

### `/kde/<table>` returns empty arrays

Usually one of these happened:

- You did not provide a date column.
- The date column name was wrong.
- The date column exists but could not be parsed as dates.

Profiling can still work without KDE.

### `/master_table` is empty

No successful pipeline run has written `processed_tables_tracker` yet.

Upload a CSV and run the process from `/Connections`.

## 18. Developer Notes

- There is no Alembic migration system yet.
- Auth tables are created by SQLAlchemy at app startup.
- Pipeline/dashboard tables are created by Spark JDBC writes.
- MongoDB is used only for source metadata.
- Secrets in `.env` are for local development only. Rotate them before any real deployment.
