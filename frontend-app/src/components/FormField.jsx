// label + input + error message, reused by every form
export default function FormField({ label, error, id, as = "input", ...inputProps }) {
  const Input = as; // draw whichever element was chosen... input or textarea or select etc
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <Input id={id} aria-invalid={Boolean(error)} {...inputProps} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}