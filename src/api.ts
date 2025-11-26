import axios from "axios";

const getApiBase = () => {
  // CRA: process.env.REACT_APP_API_URL (use typeof check to avoid ReferenceError in browser)
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Vite: import.meta.env.VITE_API_URL
  if (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }

  // Runtime injection (optional): window.__REACT_APP_API_URL__ (you can set this from your host)
  if (typeof window !== "undefined" && (window as any).__REACT_APP_API_URL__) {
    return (window as any).__REACT_APP_API_URL__;
  }

  // Fallback for local dev
  return "http://localhost:4000";
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export default api;