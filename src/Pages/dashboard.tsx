import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  program: string;
  yearLevel: number;
  status: string;
  admissionDate: string;
  updatedAt: string;
}

interface StudentSummary {
  total: number;
  statusBreakdown: { status: string; count: number }[];
  topPrograms: { program: string; count: number }[];
}

const STATUS_OPTIONS = ["enrolled", "leave", "graduated", "inactive"];
const emptyForm = {
  studentNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  program: "",
  yearLevel: "",
  admissionDate: "",
  status: "enrolled",
};

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const fullname = localStorage.getItem("fullname");
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  const canManageRecords = role === "admin";
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Student[]>("/students");
      setStudents(data); // <-- use the fetched data

      // compute summary client-side so we don't depend on a backend summary endpoint
      const computeSummaryFrom = (list: Student[]): StudentSummary => {
        const total = list.length;
        const statusCounts = list.reduce<Record<string, number>>((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {});
        const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

        const programCounts = list.reduce<Record<string, number>>((acc, s) => {
          const key = s.program || "Unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const topPrograms = Object.entries(programCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([program, count]) => ({ program, count }));

        return { total, statusBreakdown, topPrograms };
      };

      setSummary(computeSummaryFrom(data));
    } catch (error) {
      console.error("Failed to load students", error);
      setMessage("Unable to fetch students from the server.");
      // keep summary null or compute from existing students
      if (students.length) {
        // fallback compute from already-loaded students
        const fallbackSummary = {
          total: students.length,
          statusBreakdown: STATUS_OPTIONS.map((s) => ({ status: s, count: students.filter((st) => st.status === s).length })).filter(x => x.count > 0),
          topPrograms: Object.entries(students.reduce<Record<string, number>>((acc, s) => { acc[s.program] = (acc[s.program] || 0) + 1; return acc; }, {}))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([program, count]) => ({ program, count })),
        } as StudentSummary;
        setSummary(fallbackSummary);
      }
    } finally {
      setLoading(false);
    }
  };

  // remove fetchSummary usage and call only fetchStudents
  useEffect(() => {
    if (role && role !== "admin" && role !== "registrar") {
      navigate("/guestdashboard", { replace: true });
      return;
    }
    fetchStudents();
  }, [role, navigate]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const query = search.toLowerCase();
    return students.filter((student) =>
      [
        student.studentNumber,
        student.firstName,
        student.lastName,
        student.program,
        student.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [search, students]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    if (!canManageRecords) {
      setMessage("Only administrators are allowed to add or modify student records.");
      return;
    }
    setForm({ ...emptyForm });
    setEditingId(null);
    setMessage("");
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRecords) {
      setMessage("Only administrators can save changes.");
      return;
    }
    setMessage("");

    const payload = {
      studentNumber: form.studentNumber.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      program: form.program.trim(),
      yearLevel: Number(form.yearLevel),
      email: form.email.trim(),
      contactNumber: form.contactNumber.trim(),
      admissionDate: form.admissionDate,
      status: form.status,
    };

    if (
      !payload.studentNumber ||
      !payload.firstName ||
      !payload.lastName ||
      !payload.program ||
      !payload.yearLevel ||
      !payload.email ||
      !payload.admissionDate
    ) {
      setMessage("Please complete all fields before submitting.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
        setMessage("Student updated successfully.");
      } else {
        const { data } = await api.post("/students", payload);
        setMessage("Student added successfully.");
      }
      setForm({ ...emptyForm });
      setEditingId(null);
      setIsFormOpen(false);
      fetchStudents();
    } catch (error: any) {
      console.error("Failed to save student", error);
      setMessage(error?.response?.data?.message ?? "Unable to save student.");
    }
  };

  const handleEdit = (student: Student) => {
    if (!canManageRecords) {
      setMessage("Contact an administrator to edit student details.");
      return;
    }
    setEditingId(student.id);
    setForm({
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      contactNumber: student.contactNumber,
      program: student.program,
      yearLevel: student.yearLevel.toString(),
      admissionDate: student.admissionDate,
      status: student.status,
    });
    setIsFormOpen(true);
    setMessage("");
  };

  const handleCancel = () => {
    closeModal();
    setMessage("");
  };

  const handleDelete = async (id: number) => {
    if (!canManageRecords) {
      setMessage("Only administrators can delete student records.");
      return;
    }
    if (!confirm("Delete this student record?")) return;
    try {
      await api.delete(`/students/${id}`);
      setMessage("Student removed.");
      fetchStudents();
    } catch (error) {
      console.error("Failed to delete student", error);
      setMessage("Unable to delete student.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fullname");
    localStorage.removeItem("role");
    localStorage.removeItem("credentialPayload");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">Student Management</p>
          <h1>Welcome back, {fullname}</h1>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {summary && (
        <section className="dashboard__insights">
          <div>
            <p>Total Students</p>
            <strong>{summary.total}</strong>
          </div>
          <div>
            <p>Active (enrolled)</p>
            <strong>
              {summary.statusBreakdown.find((row) => row.status === "enrolled")?.count ?? 0}
            </strong>
          </div>
          <div>
            <p>Top Programs</p>
            <span>
              {summary.topPrograms.length
                ? summary.topPrograms
                    .map((program) => `${program.program} (${program.count})`)
                    .join(", ")
                : "—"}
            </span>
          </div>
        </section>
      )}

      <section className="dashboard__toolbar">
        <div>
          <h2>Student Directory</h2>
          {message && <span className="dashboard__message">{message}</span>}
          {!canManageRecords && (
            <p className="dashboard__notice">Only admins can add or update student records.</p>
          )}
        </div>
        {canManageRecords && (
          <button className="dashboard__primary-btn" onClick={openCreateModal}>
            + Add student
          </button>
        )}
      </section>

      <section className="dashboard__list">
        <div className="dashboard__list-header">
          <h3>Browse records</h3>
          <input
            className="dashboard__search"
            placeholder="Search by name, number, course or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading student records...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Program</th>
                <th>Year</th>
                <th>Status</th>
                <th>Admission</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.studentNumber}</td>
                    <td>
                      {student.lastName}, {student.firstName}
                    </td>
                    <td>{student.email}</td>
                    <td>{student.contactNumber || "—"}</td>
                    <td>{student.program}</td>
                    <td>{student.yearLevel}</td>
                    <td className={`status-pill status-pill--${student.status}`}>
                      {student.status}
                    </td>
                    <td>
                      {new Date(student.admissionDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {new Date(student.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => handleEdit(student)}
                        disabled={
                          !canManageRecords || (editingId !== null && editingId !== student.id)
                        }
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="danger"
                        disabled={
                          !canManageRecords || (editingId !== null && editingId !== student.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>No matching students.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {isFormOpen && canManageRecords && (
        <div className="dashboard-modal__overlay" role="dialog" aria-modal="true">
          <div className="dashboard-modal">
            <div className="dashboard-modal__header">
              <div>
                <p className="dashboard__eyebrow">
                  {editingId ? "Edit student" : "New student"}
                </p>
                <h2>{editingId ? "Update student details" : "Add new student"}</h2>
              </div>
              <button className="dashboard-modal__close" onClick={closeModal} aria-label="Close form">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Student Number
                  <input
                    name="studentNumber"
                    placeholder="e.g. 2025-0004"
                    value={form.studentNumber}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  First Name
                  <input
                    name="firstName"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Last Name
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  School Email
                  <input
                    name="email"
                    placeholder="name@example.edu"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Contact Number
                  <input
                    name="contactNumber"
                    placeholder="+63 900 000 0000"
                    value={form.contactNumber}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Program / Course
                  <input
                    name="program"
                    placeholder="Program / Course"
                    value={form.program}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Year Level (1-6)
                  <input
                    name="yearLevel"
                    placeholder="Year Level (1-6)"
                    type="number"
                    min={1}
                    max={6}
                    value={form.yearLevel}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Admission Date
                  <input
                    name="admissionDate"
                    type="date"
                    value={form.admissionDate}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <label>
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="dashboard__actions">
                <button type="submit">{editingId ? "Save changes" : "Add student"}</button>
                <button type="button" onClick={handleCancel} className="secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

