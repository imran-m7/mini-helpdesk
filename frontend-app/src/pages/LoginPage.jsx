import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/tickets" replace />; // already logged in

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // do not reload, we will handle login request
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname ?? "/tickets", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Log in</h1>
        {error && <p className="alert alert-error">{error}</p>} {/* if there is error show it */}
        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <p className="auth-switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}