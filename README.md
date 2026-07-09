# School Management System — Auth + Students + Teachers + Classes + Subjects + Attendance + Exams + Results

A working slice of the full School Management System described in the project
reference document, with role-based access (Admin, Teacher, Student, Parent).

Built with **Node.js + Express + MongoDB** on the backend and **plain
HTML/CSS/JavaScript** on the frontend (no build step required).

## Features

- **Auth**: register/login with JWT, 4 roles (admin, teacher, student, parent), bcrypt password hashing
- **Students**: full CRUD, search/filter by class & name, role-based visibility
- **Teachers**: full CRUD (admin-only writes; teachers can view the directory)
- **Classes**: define classes/sections, assign a class teacher
- **Subjects**: subjects tied to a class, with an assigned teacher
- **Attendance**: mark daily attendance per class (present/absent/late/leave);
  students see their own history + summary
- **Exams**: define exams per class/subject with max marks and pass marks
- **Results**: enter marks per exam (bulk, per class); automatic percentage
  and letter-grade (A+/A/B/C/D/F) calculation; students see their own
  results across all exams with pass/fail status
- Dashboard with quick stats
- Clean, responsive UI — no frontend framework or build tools needed

## Project Structure

```
school-management-system/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── models/                # User, Student, Teacher, Class, Subject, Attendance, Exam, Result
│   ├── middleware/auth.js     # JWT verification + role-based access
│   ├── routes/                 # auth, students, teachers, classes, subjects, attendance, exams, results
│   ├── server.js               # Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html / register.html
    ├── dashboard.html
    ├── students.html
    ├── teachers.html
    ├── classes.html
    ├── subjects.html
    ├── attendance.html
    ├── exams.html
    ├── results.html
    ├── css/style.css
    └── js/                     # api.js, navbar.js, and one file per page
```

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB connection (local install or MongoDB Atlas — Atlas is recommended)

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# then edit .env — set MONGO_URI and a strong JWT_SECRET
```

### 4. Run the server
```bash
npm start
```

The server starts on `http://localhost:5000` and also serves the frontend
directly, so open `http://localhost:5000` in your browser — no separate
frontend server needed.

## Using the app

1. Go to `http://localhost:5000/register.html` and create an **Admin** account first.
2. Log in — you'll land on the Dashboard.
3. Go to **Teachers** and **Students** to add records.
4. Go to **Classes** to create a class (e.g. "Grade 5", section "A") and
   optionally assign a class teacher. Make sure some students exist with a
   matching `className`/`section` — several modules below look students up
   this way.
5. Go to **Subjects** and add subjects tied to that class, each with an
   assigned teacher.
6. Go to **Attendance**, pick the class and a date, load students, mark each
   one's status, and save.
7. Go to **Exams** and create an exam tied to a class + subject, with max
   marks and pass marks.
8. From the Exams list, click **Enter Marks** (or go to **Results** and pick
   the exam) to enter each student's marks. Grades and pass/fail are
   calculated automatically.
9. Log in as a **student** account to see their own **Attendance** history
   and **Results** (with grades) — read-only, scoped to just that student.

## API Reference (quick summary)

| Method | Endpoint                       | Access           | Description               |
|--------|----------------------------------|------------------|----------------------------|
| POST   | /api/auth/register              | Public           | Create a new account       |
| POST   | /api/auth/login                 | Public           | Log in, get JWT            |
| GET    | /api/auth/me                    | Logged in        | Current user profile       |
| GET/POST/PUT/DELETE | /api/students        | varies           | Student CRUD (role-scoped) |
| GET/POST/PUT/DELETE | /api/teachers        | varies           | Teacher CRUD                |
| GET/POST/PUT/DELETE | /api/classes         | varies           | Class CRUD                  |
| GET/POST/PUT/DELETE | /api/subjects        | varies           | Subject CRUD (optional `?classId=`) |
| POST   | /api/attendance/mark            | Admin, Teacher   | Bulk mark attendance for a class/date |
| GET    | /api/attendance?classId=&date=  | Admin, Teacher   | Get a class's attendance for a date |
| GET    | /api/attendance/student/:id     | Logged in        | Student's attendance history + summary |
| GET/POST/PUT/DELETE | /api/exams           | varies           | Exam CRUD                   |
| POST   | /api/results/enter              | Admin, Teacher   | Bulk enter/update marks for an exam |
| GET    | /api/results?examId=            | Admin, Teacher   | All results for one exam, with grades |
| GET    | /api/results/student/:id        | Logged in        | Student's full result history, with grades |

All protected routes require an `Authorization: Bearer <token>` header
(handled automatically by the frontend once you're logged in).

## Notes & next steps

This covers Auth, Students, Teachers, Classes, Subjects, Attendance, Exams,
and Results from the original project document. The remaining modules —
Fees, Homework, Notices, Timetable, Library, Transport, Reports — follow the
same pattern (Mongoose model + Express routes + a simple HTML/JS page) and
can be added incrementally.

For production use, also consider: rate-limiting the login route, restricting
who can register `admin`/`teacher` accounts (currently open for demo
purposes), input validation (e.g. with `joi` or `express-validator`), and
HTTPS.
