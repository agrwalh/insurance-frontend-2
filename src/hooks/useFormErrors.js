import { useState } from "react";
import {
  extractErrorMessage,
  parseBackendFieldErrors,
} from "../utils/validators";
export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const setFieldError = (field, message) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearAll = () => {
    setFieldErrors({});
    setGeneralError("");
  };
  const handleApiError = (err) => {
    const message = extractErrorMessage(err);
    const parsed = parseBackendFieldErrors(message);

    if (parsed) {
      setFieldErrors((prev) => ({ ...prev, ...parsed }));
      setGeneralError("Please fix the highlighted fields below.");
    } else {
      setGeneralError(message);
    }
  };

  return {
    fieldErrors,
    generalError,
    setFieldError,
    clearFieldError,
    clearAll,
    handleApiError,
    setGeneralError,
  };
}
