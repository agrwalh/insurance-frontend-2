export const ROLES = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
  CUSTOMER: "CUSTOMER",
};

export const OTP_CHANNELS = ["EMAIL", "PHONE"];

export const PRODUCT_TYPES = ["HEALTH", "MOTOR", "LIFE", "TRAVEL"];

export const PREMIUM_TYPES = ["ONE_TIME", "ANNUAL"];


export const PREMIUM_FREQUENCIES = [
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "ANNUAL",
];

// Mirrors backend PremiumFrequency enum — used for live EMI preview before purchase
// Negative loadingFactor = discount/rebate, positive = extra loading charge
export const FREQUENCY_DETAILS = {
  ANNUAL: { installmentsPerYear: 1, loadingFactor: -0.02, label: "Annual" },
  HALF_YEARLY: { installmentsPerYear: 2, loadingFactor: -0.01, label: "Half-Yearly" },
  QUARTERLY: { installmentsPerYear: 4, loadingFactor: 0, label: "Quarterly" },
  MONTHLY: { installmentsPerYear: 12, loadingFactor: 0.03, label: "Monthly" },
};

export function calculateInstallment(annualPremium, frequency) {
  const details = FREQUENCY_DETAILS[frequency];
  if (!details || !annualPremium) return 0;
  const adjusted = Number(annualPremium) * (1 + details.loadingFactor);
  return Math.round((adjusted / details.installmentsPerYear) * 100) / 100;
}

// Small helper to show "Save 2%" / "+3% extra" badge next to the frequency dropdown
export function getFrequencyBadge(frequency) {
  const factor = FREQUENCY_DETAILS[frequency]?.loadingFactor ?? 0;
  if (factor < 0) return { text: `Save ${Math.abs(factor * 100).toFixed(0)}%`, tone: "discount" };
  if (factor > 0) return { text: `+${(factor * 100).toFixed(0)}% charge`, tone: "loading" };
  return { text: "No extra charge", tone: "neutral" };
}

export const PAYMENT_MODES = ["UPI", "CARD", "NET_BANKING", "CASH"];

export const PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING"];

export const POLICY_STATUSES = [
  "PENDING_PAYMENT",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
];

export const ACTIVE_LIKE_POLICY_STATUSES = ["ACTIVE", "PENDING_PAYMENT"];

export const PRODUCT_POLICY_LIMITS = {
  HEALTH: 2,
  LIFE: 2,
  MOTOR: 3,
  TRAVEL: 1,
};

export const MAX_PENDING_PAYMENT_POLICIES = 2;

export const CLAIM_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "RECOMMENDED_FOR_APPROVAL",
  "RECOMMENDED_FOR_REJECTION",
  "APPROVED",
  "REJECTED",
];

export const AGENT_REVIEW_OPTIONS = [
  "RECOMMENDED_FOR_APPROVAL",
  "RECOMMENDED_FOR_REJECTION",
];

export const ADMIN_DECISION_OPTIONS = ["APPROVED", "REJECTED"];

export const DOCUMENT_TYPES = [
  "MEDICAL_REPORT",
  "POLICE_REPORT",
  "INVOICE",
  "PHOTO",
  "OTHER",
];

export const NOMINEE_RELATIONS = [
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FRIEND",
  "OTHER",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
