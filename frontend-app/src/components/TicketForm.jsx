import { useState } from "react";
import { Link } from "react-router";
import { PRIORITIES, formatLabel } from "../utils/format";
import FormField from "./FormField";

// same rules as the backend's TicketCreate/TicketUpdate schemas
function validate({ title, description }) {
  const errors = {};
  if (title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
  if (title.trim().length > 200) errors.title = "Title can be at most 200 characters.";
  if (!description.trim()) errors.description = "Description is required.";
  if (description.length > 5000) errors.description = "Description can be at most 5000 characters.";
  return errors;
}

// form itself, used for both "new" and "edit". The page decides what happens on submit.
export default function TicketForm({ initialValues, submitLabel, canChangePriority, cancelTo, onSubmit }) {
  const [form, setForm] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: undefined }); // hide a field's error once it's edited
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true); // button changed to saving
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
    } catch (err) { // if it fails for some reason in backend
      setError(err.message);
      setFieldErrors(err.fieldErrors ?? {});
      setSubmitting(false);
    }
  }

  return (
    <form className="card ticket-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="alert alert-error">{error}</p>}
      <FormField
        id="title"
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={fieldErrors.title}
        maxLength={200}
      />
      <FormField
        id="description"
        label="Description"
        name="description"
        as="textarea"
        rows={6}
        value={form.description}
        onChange={handleChange}
        error={fieldErrors.description}
        maxLength={5000}
      />
      <FormField
        id="priority"
        label="Priority"
        name="priority"
        as="select"
        value={form.priority}
        onChange={handleChange}
        error={fieldErrors.priority}
        disabled={!canChangePriority}
      >
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {formatLabel(priority)}
          </option>
        ))}
      </FormField>
      {!canChangePriority && <p className="muted">Only agents can change the priority after a ticket is created.</p>}

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
        <Link className="btn btn-secondary" to={cancelTo}>
          Cancel
        </Link>
      </div>
    </form>
  );
}