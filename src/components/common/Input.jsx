import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  error,
  helperText,
  type = "text",
  required = false,
  id,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;

  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
      )}

      <div className="input-wrapper">
        <input
          id={inputId}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={`form-input ${error ? "input-error" : ""}`}
          onWheel={handleWheel}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error || helperText ? `${inputId}-feedback` : undefined
          }
          required={required}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-feedback`} className="field-error">
          {error}
        </span>
      ) : (
        helperText && (
          <span id={`${inputId}-feedback`} className="field-hint">
            {helperText}
          </span>
        )
      )}
    </div>
  );
}
