import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

// same rules as the backend's UserCreate schema, checked before sending
function validate({ fullName, email, password, confirmPassword }) {
  const errors = {};
  if (fullName.trim().length < 2) errors.full_name = "Name must be at least 2 characters.";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/tickets" replace />;

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.fullName, form.email, form.password);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors ?? {}); // 422 errors from the backend, per field
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create account</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <FormField
          id="fullName"
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={form.fullName}
          onChange={handleChange}
          error={fieldErrors.full_name}
        />
        <FormField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Register"}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}