import { formatLabel } from "../../utils/formatters";
const STATUS_STYLES = {
  ACTIVE: "badge-green",
  APPROVED: "badge-green",
  SUCCESS: "badge-green",
  PENDING_PAYMENT: "badge-amber",
  PENDING: "badge-amber",
  SUBMITTED: "badge-amber",
  UNDER_REVIEW: "badge-blue",
  RECOMMENDED_FOR_APPROVAL: "badge-blue",
  RECOMMENDED_FOR_REJECTION: "badge-red",
  EXPIRED: "badge-grey",
  CANCELLED: "badge-red",
  REJECTED: "badge-red",
  FAILED: "badge-red",
};

export default function StatusBadge({ status }) {
  const styleClass = STATUS_STYLES[status] || "badge-grey";
  return <span className={`badge ${styleClass}`}>{formatLabel(status)}</span>;
}
