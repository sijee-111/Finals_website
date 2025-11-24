# Student Management System

A full-stack student management system built with Vite + React on the frontend and an Express + MySQL API on the backend. Admins and registrars can add, edit, and remove student records, while guests (students) get a read-only dashboard of recent updates. Each record tracks contact details, admission date, and enrollment status so you can follow every learner from onboarding through graduation.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios
- **Backend:** Express 5, mysql2, Google OAuth (optional)
- **Database:** MySQL 8+ (schema provided in `server/schema.sql`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

1. Start MySQL locally (Laragon/XAMPP/etc.).
2. Import `server/schema.sql` to create the `users` and `students` tables and seed default data:

```bash
mysql -u root -p < server/schema.sql
```

> Update the credentials inside `server/server.ts` if your MySQL username/password differ.

### 3. Run the API server

```bash
cd server
tsx server.ts    # or: npx ts-node server.ts
```

The server listens on `http://localhost:4000`.

### 4. Start the Vite dev server

```bash
npm run dev
```

Open the app at `http://localhost:5173`.

## Default Access

An administrator account is seeded automatically:

- **Username:** `admin`
- **Password:** `admin123`

Create student/guest accounts through the registration page if needed.

## API Overview

| Method | Endpoint            | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | `/students`         | List all students (full detail)      |
| GET    | `/students/:id`     | Fetch a single student               |
| GET    | `/students/summary` | Aggregated counts by status/program  |
| POST   | `/students`         | Create a new student record          |
| PUT    | `/students/:id`     | Update an existing student           |
| DELETE | `/students/:id`     | Remove a student record              |

Authentication endpoints (`/login`, `/register`, `/google-login`) are also available for the UI.

## Scripts

- `npm run dev` – start Vite
- `npm run build` – type-check + production build
- `npm run preview` – preview built assets
- `npm run lint` – run ESLint

---

Feel free to customize the schema, UI, or authentication strategy to match your school’s requirements. Contributions and bug reports are welcome! ***!
