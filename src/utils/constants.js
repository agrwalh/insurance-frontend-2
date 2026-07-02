
export const ROLES = {
  ADMIN: "ADMIN",
  AGENT: "AGENT",
  CUSTOMER: "CUSTOMER",
};

export const OTP_CHANNELS = ["EMAIL", "PHONE"];

export const PRODUCT_TYPES = ["HEALTH", "MOTOR", "LIFE", "TRAVEL"];

export const PREMIUM_TYPES = ["ONE_TIME", "ANNUAL"];

export const PAYMENT_MODES = ["UPI", "CARD", "NET_BANKING", "CASH"];

export const PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING"];

export const POLICY_STATUSES = ["PENDING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED"];

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

export const AGENT_REVIEW_OPTIONS = ["RECOMMENDED_FOR_APPROVAL", "RECOMMENDED_FOR_REJECTION"];

export const ADMIN_DECISION_OPTIONS = ["APPROVED", "REJECTED"];

export const DOCUMENT_TYPES = ["MEDICAL_REPORT", "POLICE_REPORT", "INVOICE", "PHOTO", "OTHER"];

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
