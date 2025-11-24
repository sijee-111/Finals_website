
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

interface DashboardProps {
  role: string;
}

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

interface Summary {
  total: number;
  statusBreakdown: { status: string; count: number }[];
}

type CredentialSnapshot = {
  method: "manual" | "google";
  username?: string;
  password?: string;
  fullname?: string;
  tokenSnippet?: string;
  recordedAt?: string;
};

export default function GuestDashboard({ role }: DashboardProps) {
  const fullname = localStorage.getItem("fullname");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [credentialSnapshot, setCredentialSnapshot] = useState<CredentialSnapshot | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<Student[]>("http://localhost:4000/students");
        setStudents(data);
      } catch (error) {
        console.error("Unable to load students", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSummary = async () => {
      try {
        const { data } = await axios.get<Summary>("http://localhost:4000/students/summary");
        setSummary(data);
      } catch (error) {
        console.error("Unable to load summary", error);
      }
    };

    fetchStudents();
    fetchSummary();
    try {
      const raw = localStorage.getItem("credentialPayload");
      if (raw) {
        setCredentialSnapshot(JSON.parse(raw));
      }
    } catch (error) {
      console.error("Unable to parse credential snapshot", error);
    }
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) =>
      `${student.studentNumber} ${student.firstName} ${student.lastName} ${student.program} ${student.email} ${student.contactNumber ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [students, search]);

  const recentStudents = filteredStudents.slice(0, 5);
  const totalStudents = summary?.total ?? students.length;
  const activeStudents =
    summary?.statusBreakdown.find((item) => item.status === "enrolled")?.count ??
    students.filter((student) => student.status === "enrolled").length;

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="guest-dashboard">
      <header className="guest-dashboard__header">
        <div>
          <p className="guest-dashboard__eyebrow">Student Management</p>
          <h1 className="fullname">Welcome, {fullname}</h1>
          <h2 className="role">{role}</h2>
        </div>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </header>

      <section className="guest-dashboard__insights">
        <div>
          <p>Total students</p>
          <strong>{totalStudents}</strong>
        </div>
        <div>
          <p>Active (enrolled)</p>
          <strong>{activeStudents}</strong>
        </div>
      </section>

      <section className="guest-dashboard__credentials">
        <div className="guest-dashboard__credentials-header">
          <div>
            <p className="guest-dashboard__eyebrow">Login credentials</p>
            <h3>Stored credential snapshot</h3>
          </div>
          <button
            className="guest-dashboard__credentials-toggle"
            onClick={() => setShowCredentials((prev) => !prev)}
          >
            {showCredentials ? "Hide details" : "View credentials"}
          </button>
        </div>

        {credentialSnapshot ? (
          <div className="credential-card">
            <div className="credential-card__row">
              <span className="credential-card__label">Method</span>
              <span className="credential-card__value">
                {credentialSnapshot.method === "google" ? "Google OAuth" : "Username & password"}
              </span>
            </div>
            {credentialSnapshot.method === "manual" ? (
              <>
                <div className="credential-card__row">
                  <span className="credential-card__label">Username</span>
                  <span className="credential-card__value">{credentialSnapshot.username ?? "—"}</span>
                </div>
                <div className="credential-card__row">
                  <span className="credential-card__label">Password</span>
                  <span className="credential-card__value">
                    {showCredentials ? credentialSnapshot.password ?? "—" : "••••••••"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="credential-card__row">
                  <span className="credential-card__label">Account</span>
                  <span className="credential-card__value">
                    {credentialSnapshot.fullname ?? fullname ?? "—"}
                  </span>
                </div>
                <div className="credential-card__row">
                  <span className="credential-card__label">Token preview</span>
                  <span className="credential-card__value">
                    {showCredentials
                      ? credentialSnapshot.tokenSnippet ?? "—"
                      : "Hidden (toggle to view)"}
                  </span>
                </div>
              </>
            )}
            <div className="credential-card__row">
              <span className="credential-card__label">Recorded</span>
              <span className="credential-card__value">
                {credentialSnapshot.recordedAt
                  ? new Date(credentialSnapshot.recordedAt).toLocaleString()
                  : "—"}
              </span>
            </div>
            <p className="credential-card__hint">
              Credentials are stored locally on this device for your reference only.
            </p>
          </div>
        ) : (
          <p className="credential-card__empty">No credential snapshot found for this session.</p>
        )}
      </section>

      <section className="guest-dashboard__list">
        <div className="guest-dashboard__list-header">
          <h3 className="section-title">Recently updated students</h3>
          <input
            placeholder="Search students"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <p>Loading student directory…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student No.</th>
                <th>Name</th>
                <th>Email</th>
                <th>Program</th>
                <th>Year</th>
                <th>Status</th>
                <th>Admission</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length ? (
                recentStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentNumber}</td>
                    <td>
                      {student.lastName}, {student.firstName}
                    </td>
                    <td>{student.email}</td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}