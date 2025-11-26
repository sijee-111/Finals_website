import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    roleni: "student",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = (localStorage.getItem("role") ?? "").toLowerCase();
    if (storedRole !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/register", form);
      setMessage(res.data.message);
      if (res.data.success) setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      console.error(err);
      setMessage("Registration failed. Try again.");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">Create an account</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              name="roleni"
              id="role"
              value={form.roleni}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="student">Student</option>
              <option value="registrar">Registrar</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <p className="login-link">
          Already have an account?{" "}
          <Link to="/" className="link">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}