import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

const STATUS_LABELS: Record<string, string> = {
  enrolled: "Enrolled",
  leave: "On Leave",
  graduated: "Graduated",
  inactive: "Inactive",
};

export default function StudentProfile() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const navigate = useNavigate();
  const username = (localStorage.getItem("username") ?? "").trim();
  const role = (localStorage.getItem("role") ?? "").toLowerCase();
  const fullname = (localStorage.getItem("fullname") ?? "").trim();

  useEffect(() => {
    if (role !== "student") {
      navigate("/", { replace: true });
      return;
    }

    if (!username) {
      setError("Missing student identifier. Please contact the registrar.");
      setLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<Student[]>("http://localhost:4000/students");
        const normalizedFullname = fullname.toLowerCase();

        const match = data.find((record) => {
          const numberMatch = record.studentNumber.toLowerCase() === username.toLowerCase();
          const emailMatch = record.email.toLowerCase() === username.toLowerCase();
          const nameMatch =
            `${record.firstName} ${record.lastName}`.toLowerCase() === normalizedFullname ||
            `${record.lastName} ${record.firstName}`.toLowerCase() === normalizedFullname;
          return numberMatch || emailMatch || nameMatch;
        });

        if (!match) {
          setError("We couldn't locate a profile for your account.");
        } else {
          setStudent(match);
          setLastUpdated(
            new Date(match.updatedAt ?? match.admissionDate).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("Failed to load student profile", err);
        setError("Unable to load your student record right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [username, role, fullname, navigate]);

  const profileFields = useMemo(() => {
    if (!student) return [];
    return [
      { label: "Student Number", value: student.studentNumber },
      { label: "Program", value: student.program },
      { label: "Year Level", value: `Year ${student.yearLevel}` },
      { label: "Status", value: STATUS_LABELS[student.status] ?? student.status },
      {
        label: "Admission Date",
        value: new Date(student.admissionDate).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      },
      { label: "Email", value: student.email },
      { label: "Contact Number", value: student.contactNumber || "—" },
    ];
  }, [student]);

  return (
    <div className="student-profile">
      <header className="student-profile__header">
        <div>
          <p className="student-profile__eyebrow">My Student Profile</p>
          <h1>{fullname || `${student?.firstName ?? ""} ${student?.lastName ?? ""}`}</h1>
          {lastUpdated && <span className="student-profile__meta">Updated {lastUpdated}</span>}
        </div>
        <button
          className="student-profile__logout"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </header>

      <section className="student-profile__card">
        {loading && <p>Loading your details…</p>}
        {!loading && error && <p className="student-profile__error">{error}</p>}
        {!loading && !error && student && (
          <div className="student-profile__grid">
            {profileFields.map((field) => (
              <div key={field.label} className="student-profile__field">
                <span className="label">{field.label}</span>
                <strong>{field.value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {!loading && student && (
        <section className="student-profile__timeline">
          <h2>Academic overview</h2>
          <div className="student-profile__timeline-card">
            <div>
              <p className="label">Program</p>
              <strong>{student.program}</strong>
            </div>
            <div>
              <p className="label">Current standing</p>
              <strong>{STATUS_LABELS[student.status] ?? student.status}</strong>
            </div>
            <div>
              <p className="label">Year level</p>
              <strong>Year {student.yearLevel}</strong>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

