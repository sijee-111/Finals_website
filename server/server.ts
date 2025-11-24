
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // update if your local MySQL password is different
  database: "typescript1",
});

// GOOGLE AUTH SETUP
const client = new OAuth2Client(
  "987959701147-5t9sqb0ck58hfthni81q4e9ge2o5jqel.apps.googleusercontent.com"
);

const ALLOWED_ROLES = new Set(["admin", "registrar", "student"]);

type StudentPayload = {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  program: string;
  yearLevel: number;
  admissionDate: string;
  status: string;
};

const STUDENT_SELECT = `
  SELECT 
    id,
    student_number AS studentNumber,
    first_name AS firstName,
    last_name AS lastName,
    email,
    COALESCE(contact_number, '') AS contactNumber,
    program,
    year_level AS yearLevel,
    admission_date AS admissionDate,
    status,
    updated_at AS updatedAt
  FROM students
`;

const normalizeRole = (role?: string) => {
  const safeRole = (role ?? "").trim().toLowerCase();
  return ALLOWED_ROLES.has(safeRole) ? safeRole : "student";
};

const parseStudentPayload = (body: any) => {
  const studentNumber = (body.studentNumber ?? "").trim();
  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const contactNumber = (body.contactNumber ?? "").trim();
  const program = (body.program ?? "").trim();
  const yearLevel = Number(body.yearLevel);
  const admissionDate = (body.admissionDate ?? "").trim();
  const status = (body.status ?? "").trim().toLowerCase();

  if (
    !studentNumber ||
    !firstName ||
    !lastName ||
    !program ||
    !status ||
    !email ||
    !admissionDate
  ) {
    return { valid: false, message: "All fields are required." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, message: "Please provide a valid school email address." };
  }

  if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 6) {
    return { valid: false, message: "Year level must be a number between 1 and 6." };
  }

  const parsedAdmission = new Date(admissionDate);
  if (Number.isNaN(parsedAdmission.getTime())) {
    return { valid: false, message: "Admission date is invalid." };
  }
  const normalizedAdmissionDate = parsedAdmission.toISOString().slice(0, 10);

  const normalizedStatus = ["enrolled", "leave", "graduated", "inactive"].includes(status)
    ? status
    : "enrolled";

  return {
    valid: true,
    payload: {
      studentNumber,
      firstName,
      lastName,
      email,
      contactNumber,
      program,
      yearLevel,
      admissionDate: normalizedAdmissionDate,
      status: normalizedStatus,
    } as StudentPayload,
  };
};

// ======================= REGISTER =======================
app.post("/register", async (req, res) => {
  const { fullname, username, password, roleni } = req.body;

  if (!fullname || !username || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const [existing]: any = await db.query("SELECT id FROM users WHERE username = ?", [username]);
    if (existing.length > 0) {
      return res.json({ success: false, message: "Username already exists." });
    }

    const safeRole = normalizeRole(roleni);
    await db.query(
      `INSERT INTO users (fullname, username, password, role, email, google_id)
       VALUES (?, ?, ?, ?, '', '')`,
      [fullname, username, password, safeRole]
    );

    res.json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
});

// ======================= MANUAL LOGIN =======================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  try {
    const [rows]: any = await db.query(
      "SELECT fullname, role FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Invalid username or password." });
    }

    const user = rows[0];
    res.json({
      success: true,
      fullname: user.fullname,
      role: user.role,
      message: "Login successful!",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ======================= GOOGLE LOGIN =======================
app.post("/google-login", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "987959701147-5t9sqb0ck58hfthni81q4e9ge2o5jqel.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name } = payload!;

    const [rows]: any = await db.query("SELECT fullname, role FROM users WHERE google_id = ?", [
      google_id,
    ]);

    if (rows.length === 0) {
      await db.query(
        "INSERT INTO users (fullname, email, google_id, role, username, password) VALUES (?, ?, ?, 'student', '', '')",
        [name, email, google_id]
      );
      return res.json({
        success: true,
        fullname: name,
        role: "student",
        message: "Google login successful!",
      });
    }

    const user = rows[0];
    res.json({
      success: true,
      fullname: user.fullname,
      role: user.role,
      message: "Google login successful!",
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ success: false, message: "Google login failed." });
  }
});

// ======================= STUDENT MANAGEMENT =======================
app.get("/students", async (_req, res) => {
  try {
    const [rows]: any = await db.query(`${STUDENT_SELECT} ORDER BY updated_at DESC`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows]: any = await db.query(`${STUDENT_SELECT} WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/students", async (req, res) => {
  const { valid, message, payload } = parseStudentPayload(req.body);
  if (!valid || !payload) {
    return res.status(400).json({ success: false, message });
  }

  try {
    await db.query(
      `INSERT INTO students (
        student_number,
        first_name,
        last_name,
        email,
        contact_number,
        program,
        year_level,
        admission_date,
        status
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.studentNumber,
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.contactNumber || null,
        payload.program,
        payload.yearLevel,
        payload.admissionDate,
        payload.status,
      ]
    );
    res.json({ success: true, message: "Student added successfully" });
  } catch (error: any) {
    console.error("Error adding student:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Student number already exists." });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const { valid, message, payload } = parseStudentPayload(req.body);
  if (!valid || !payload) {
    return res.status(400).json({ success: false, message });
  }

  try {
    const [result]: any = await db.query(
      `UPDATE students 
       SET 
        student_number = ?, 
        first_name = ?, 
        last_name = ?, 
        email = ?, 
        contact_number = ?, 
        program = ?, 
        year_level = ?, 
        admission_date = ?, 
        status = ?
       WHERE id = ?`,
      [
        payload.studentNumber,
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.contactNumber || null,
        payload.program,
        payload.yearLevel,
        payload.admissionDate,
        payload.status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student updated successfully" });
  } catch (error: any) {
    console.error("Error updating student:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ success: false, message: "Student number already exists." });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/students/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result]: any = await db.query("DELETE FROM students WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/students/summary", async (_req, res) => {
  try {
    const [[{ total }]]: any = await db.query("SELECT COUNT(*) AS total FROM students");
    const [statusRows]: any = await db.query(
      "SELECT status, COUNT(*) AS count FROM students GROUP BY status"
    );
    const [programRows]: any = await db.query(
      `SELECT program, COUNT(*) AS count 
         FROM students 
         GROUP BY program 
         ORDER BY count DESC 
         LIMIT 5`
    );

    res.json({
      total: total ?? 0,
      statusBreakdown: statusRows,
      topPrograms: programRows,
    });
  } catch (error) {
    console.error("Error building student summary:", error);
    res.status(500).json({ success: false, message: "Unable to load summary data." });
  }
});

// ======================= START SERVER =======================
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
