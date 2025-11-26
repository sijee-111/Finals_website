import { useState } from "react";
import "./App.css";
import axios from "axios";

type StudentRecord = {
  studentNumber: string;
  email: string;
  firstName: string;
  lastName: string;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const setStudentSession = (record: StudentRecord) => {
    localStorage.setItem("fullname", `${record.firstName} ${record.lastName}`);
    localStorage.setItem("role", "student");
    localStorage.setItem("username", record.email);
    localStorage.setItem("studentEmail", record.email);
    localStorage.setItem("studentNumber", record.studentNumber);
  };

  const syncStudentIdentity = async (emailInput: string, passwordInput: string) => {
    try {
      const { data } = await axios.get<StudentRecord[]>(process.env.REACT_APP_API_URL || "http://localhost:4000");
      const normalizedEmail = emailInput.trim().toLowerCase();
      const normalizedNumber = passwordInput.trim().toLowerCase();
      const match = data.find(
        (student) =>
          student.email.toLowerCase() === normalizedEmail ||
          student.studentNumber.toLowerCase() === normalizedNumber
      );

      if (match) {
        setStudentSession(match);
        return true;
      }
    } catch (error) {
      console.error("Unable to link student identity:", error);
    }
    return false;
  };

  const attemptStudentSelfLogin = async () => {
    const normalizedEmail = username.trim().toLowerCase();
    const normalizedNumber = password.trim().toLowerCase();
    if (!normalizedEmail || !normalizedNumber) {
      return false;
    }
    try {
      const { data } = await axios.get<StudentRecord[]>(process.env.REACT_APP_API_URL || "http://localhost:4000");
      const match = data.find(
        (student) =>
          student.email.toLowerCase() === normalizedEmail &&
          student.studentNumber.toLowerCase() === normalizedNumber
      );
      if (match) {
        setStudentSession(match);
        setMessage("Login successful!");
        window.location.href = "/student";
        return true;
      }
    } catch (error) {
      console.error("Self-login lookup failed:", error);
    }
    return false;
  };

  // === Manual login ===
  const handleLogin = async () => {
    try {
      const { data } = await axios.post(process.env.REACT_APP_API_URL || "http://localhost:4000", {
        username,
        password,
      });

      if (data.success) {
        const normalizedRole = (data.role ?? "").toLowerCase();
        localStorage.setItem("fullname", data.fullname);
        localStorage.setItem("role", normalizedRole);
        localStorage.setItem("username", username);
        setMessage("Login successful!");

        if (normalizedRole === "student") {
          const linked = await syncStudentIdentity(username, password);
          if (!linked) {
            const fallbackLinked = await attemptStudentSelfLogin();
            if (fallbackLinked) return;
          }
        }

        if (normalizedRole === "admin") {
          window.location.href = "/dashboard";
        } else if (normalizedRole === "registrar") {
          window.location.href = "/dashboard";
        } else if (normalizedRole === "student") {
          window.location.href = "/student";
        } else {
          window.location.href = "/guestdashboard";
        }
      } else {
        const fallbackLinked = await attemptStudentSelfLogin();
        if (!fallbackLinked) {
          setMessage(data.message);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      const fallbackLinked = await attemptStudentSelfLogin();
      if (!fallbackLinked) {
        setMessage("Server error");
      }
    }
  //    if (data.success) {
  //       localStorage.setItem("fullname", data.fullname || "");
  //       setMessage("Login successful!");
  //       window.location.href = "/dashboard";
  //     } else {
  //       setMessage(data.message || "Invalid credentials");
  //     }
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     setMessage("Server error. Please try again later.");
  //   }
  };

  return (
    <div className="login">
      <h2>Student Management System</h2>
      <p className="login__subtitle">
        Track student enrollment, programs, and year levels in one place.
      </p>

      <input
        type="text"
        placeholder="School Email"
        value={username}
        required
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Student Number (Password)"
        value={password}
        required
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>
      <p className="login__note">Need an account? Ask an administrator to create one.</p>

      <hr />

      <p>{message}</p>
    </div>
  );
}
