import { formatLabel } from "../../utils/formatters";
export default function Select({ label, error, options = [], placeholder = "Select...", ...rest }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <select className={`form-input ${error ? "input-error" : ""}`} {...rest}>
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
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
