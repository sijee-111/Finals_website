

import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";
import Dashboard from "./Pages/dashboard";
import GuestDashboard from "./Pages/guestdashboard";
import Register from "./Pages/register";
import ProtectedRoute from "./protectedroute";
import StudentProfile from "./Pages/studentprofile";

export default function App() {
  const fullname = localStorage.getItem("fullname");
  const role = (localStorage.getItem("role") ?? "").toLowerCase();

  const defaultDestination =
    role === "admin" || role === "registrar"
      ? "/dashboard"
      : role === "student"
      ? "/student"
      : "/guestdashboard";

  return (
    <Routes>
      <Route
        path="/"
        element={fullname ? <Navigate to={defaultDestination} replace /> : <Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "registrar"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guestdashboard"
        element={
          <ProtectedRoute>
            <GuestDashboard role={role} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
