import { useId } from "react";

export default function Input({ label, error, helperText, type = "text", required = false, id, ...rest }) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;

  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}{required && <span className="required-mark"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`form-input ${error ? "input-error" : ""}`}
        onWheel={handleWheel}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${inputId}-feedback` : undefined}
        required={required}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-feedback`} className="field-error">{error}</span>
      ) : (
        helperText && <span id={`${inputId}-feedback`} className="field-hint">{helperText}</span>
      )}
    </div>
  );
}
