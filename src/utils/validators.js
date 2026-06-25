import { getApiErrorMessage } from "./apiResponse";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

export function isValidMobile(value) {
  return MOBILE_REGEX.test(String(value || "").trim());
}

export function isValidPinCode(value) {
  return PIN_CODE_REGEX.test(String(value || "").trim());
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
  if (!/[A-Za-z]/.test(password))
    return { valid: false, message: "Must include at least one letter" };
  if (!/[0-9]/.test(password))
    return { valid: false, message: "Must include at least one number" };
  if (/^\s|\s$/.test(password))
    return { valid: false, message: "Cannot start or end with a space" };
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
