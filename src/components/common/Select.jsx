import { useId } from "react";
import { formatLabel } from "../../utils/formatters";

export default function Select({ label, error, helperText, options = [], placeholder = "Select...", required = false, id, ...rest }) {
  const generatedId = useId();
  const selectId = id || rest.name || generatedId;
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={selectId}>
          {label}{required && <span className="required-mark"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`form-input ${error ? "input-error" : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${selectId}-feedback` : undefined}
        required={required}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const text = typeof opt === "string" ? formatLabel(opt) : opt.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
      {error ? (
        <span id={`${selectId}-feedback`} className="field-error">{error}</span>
      ) : (
        helperText && <span id={`${selectId}-feedback`} className="field-hint">{helperText}</span>
      )}
    </div>
  );
}
