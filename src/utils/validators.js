import { getApiErrorMessage } from "./apiResponse";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
const PERSON_NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,98}[A-Za-z]$/;
const CITY_STATE_REGEX = /^[A-Za-z][A-Za-z .'-]{1,98}[A-Za-z]$/;
const PLAN_PRODUCT_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9 .,&()+'-]{2,148}$/;
const TRANSACTION_REF_REGEX = /^[A-Za-z0-9][A-Za-z0-9_/-]{5,49}$/;
const DOCUMENT_REF_REGEX = /^[A-Za-z0-9][A-Za-z0-9 .#_:/-]{2,149}$/;
const OTP_REGEX = /^\d{6}$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

export function isValidMobile(value) {
  return MOBILE_REGEX.test(String(value || "").trim());
}

export function isValidPinCode(value) {
  return PIN_CODE_REGEX.test(String(value || "").trim());
}

export function hasRepeatedCharactersOnly(value) {
  const normalized = String(value || "").trim().replace(/\s+/g, "");
  return normalized.length >= 3 && /^(.)\1+$/.test(normalized);
}

export function hasMinimumWords(value, minWords = 2) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length >= minWords;
}

export function isValidPersonName(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return PERSON_NAME_REGEX.test(text) && !hasRepeatedCharactersOnly(text);
}

export function isValidCityOrState(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return CITY_STATE_REGEX.test(text) && !hasRepeatedCharactersOnly(text);
}

export function isValidPlanOrProductName(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return PLAN_PRODUCT_NAME_REGEX.test(text) && !hasRepeatedCharactersOnly(text);
}

export function isValidTransactionReference(value) {
  return TRANSACTION_REF_REGEX.test(String(value || "").trim());
}

export function isValidDocumentReference(value) {
  return DOCUMENT_REF_REGEX.test(String(value || "").trim()) && !hasRepeatedCharactersOnly(value);
}

export function isValidOtp(value) {
  return OTP_REGEX.test(String(value || "").trim());
}

export function isMeaningfulText(value, { minLength = 10, minWords = 2, maxLength = 2000 } = {}) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (text.length < minLength || text.length > maxLength) return false;
  if (!hasMinimumWords(text, minWords)) return false;
  if (hasRepeatedCharactersOnly(text)) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  return true;
}

export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function parseStrictNumber(value) {
  if (isBlank(value)) return null;
  const stringValue = String(value).trim();

  if (!/^-?\d+(\.\d+)?$/.test(stringValue)) return null;
  const parsed = Number(stringValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isPositiveAmount(value) {
  const n = parseStrictNumber(value);
  return n !== null && n > 0;
}

export function passwordStrength(password) {
  if (!password) return { valid: false, message: "Password is required" };
  if (password.length < 8)
    return { valid: false, message: "Must be at least 8 characters" };
  if (password.length > 72)
    return { valid: false, message: "Must be under 72 characters" };
  if (!/[a-z]/.test(password))
    return { valid: false, message: "Must include at least one lowercase letter" };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: "Must include at least one uppercase letter" };
  if (!/[0-9]/.test(password))
    return { valid: false, message: "Must include at least one number" };
  if (!/[^A-Za-z0-9]/.test(password))
    return { valid: false, message: "Must include at least one special character" };
  if (/^\s|\s$/.test(password))
    return { valid: false, message: "Cannot start or end with a space" };
  if (hasRepeatedCharactersOnly(password))
    return { valid: false, message: "Cannot be the same character repeated" };
  return { valid: true, message: "" };
}

export function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isPastOrToday(value) {
  const d = toDateOnly(value);
  if (!d) return false;
  return d.getTime() <= startOfToday().getTime();
}

export function isFutureOrToday(value) {
  const d = toDateOnly(value);
  if (!d) return false;
  return d.getTime() >= startOfToday().getTime();
}

export function isAtLeast18YearsOld(dobValue) {
  const dob = toDateOnly(dobValue);
  if (!dob) return false;
  const eighteenYearsAgo = startOfToday();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  return dob.getTime() <= eighteenYearsAgo.getTime();
}

export function isRealisticDob(dobValue) {
  const dob = toDateOnly(dobValue);
  if (!dob) return false;
  const earliestReasonable = startOfToday();
  earliestReasonable.setFullYear(earliestReasonable.getFullYear() - 120);
  return dob.getTime() >= earliestReasonable.getTime();
}

export function parseBackendFieldErrors(message) {
  if (!message || typeof message !== "string") return null;
  const prefix = "Validation failed: ";
  if (!message.startsWith(prefix)) return null;

  try {
    const mapPart = message.slice(prefix.length).trim();
    const inner = mapPart.replace(/^\{/, "").replace(/\}$/, "");
    if (!inner) return null;

    const entries = {};

    inner.split(/,\s+(?=[A-Za-z0-9_]+=)/).forEach((pair) => {
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) return;
      const field = pair.slice(0, eqIndex).trim();
      const msg = pair.slice(eqIndex + 1).trim();
      if (field) entries[field] = msg;
    });

    return Object.keys(entries).length > 0 ? entries : null;
  } catch {
    return null;
  }
}

export function extractErrorMessage(
  err,
  fallback = "Something went wrong. Please try again.",
) {
  return getApiErrorMessage(err, fallback);
}
