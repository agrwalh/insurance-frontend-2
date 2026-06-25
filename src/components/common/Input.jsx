
export default function Input({ label, error, helperText, type = "text", ...rest }) {

  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        className={`form-input ${error ? "input-error" : ""}`}
        onWheel={handleWheel}
        {...rest}
      />
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        helperText && <span className="field-hint">{helperText}</span>
      )}
    </div>
  );
}
