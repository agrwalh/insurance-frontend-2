import { useState } from "react";
import { Link } from "react-router-dom";
import { policyApi } from "../../api/policyApi";
import { paymentApi } from "../../api/paymentApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { PAYMENT_MODES } from "../../utils/constants";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isValidTransactionReference } from "../../utils/validators";

function getAnnualPaymentWindow(policy) {
  if (policy.premiumType !== "ANNUAL") {
    return { allowed: true, message: "" };
  }

  if ((policy.premiumsPaid ?? 0) >= (policy.durationYears ?? 0)) {
    return { allowed: false, message: "All annual premiums are already paid." };
  }

  if (policy.status === "PENDING_PAYMENT" || (policy.premiumsPaid ?? 0) === 0) {
    return { allowed: true, message: "First annual premium is due now to activate your policy." };
  }

  if (!policy.nextPremiumDueDate) {
    return { allowed: false, message: "Next premium due date is not available." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(policy.nextPremiumDueDate);
  dueDate.setHours(0, 0, 0, 0);

  const windowStart = new Date(dueDate);
  windowStart.setMonth(windowStart.getMonth() - 1);

  if (today < windowStart) {
    return {
      allowed: false,
      message: `Next premium opens on ${formatDate(windowStart)}. Due date: ${formatDate(policy.nextPremiumDueDate)}.`,
    };
  }

  return {
    allowed: true,
    message: `Premium window is open. Due date: ${formatDate(policy.nextPremiumDueDate)}.`,
  };
}

export default function MyPolicies() {
  const [page, setPage] = useState(0);
  const [payingPolicy, setPayingPolicy] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentMode: "",
    transactionReference: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const {
    fieldErrors,
    generalError,
    setFieldError,
    clearFieldError,
    clearAll,
    handleApiError,
  } = useFormErrors();

  const {
    data,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(() => policyApi.getMyPolicies({ page, size: 10 }), [page]);

  const openPaymentForm = (policy) => {
    const annualWindow = getAnnualPaymentWindow(policy);
    if (!annualWindow.allowed) {
      clearAll();
      setSuccess("");
      setFieldError("paymentWindow", annualWindow.message);
      return;
    }
    setPayingPolicy(policy);
    setPaymentForm({ paymentMode: "", transactionReference: "" });
    clearAll();
    setSuccess("");
  };

  const handlePaymentChange = (e) => {
    setPaymentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearFieldError(e.target.name);
  };

  const validate = () => {
    const errors = {};
    if (isBlank(paymentForm.paymentMode)) {
      errors.paymentMode = "Please choose a payment mode";
    }
    if (isBlank(paymentForm.transactionReference)) {
      errors.transactionReference = "Transaction reference is required";
    } else if (
      !isValidTransactionReference(paymentForm.transactionReference)
    ) {
      errors.transactionReference =
        "Use a valid 6-50 character transaction reference";
    }
    return errors;
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    clearAll();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) =>
        setFieldError(field, message),
      );
      return;
    }

    setSubmitting(true);
    try {
      await paymentApi.recordPayment({
        policyId: payingPolicy.policyId,
        amount: payingPolicy.premiumAmount,
        paymentMode: paymentForm.paymentMode,
        transactionReference: paymentForm.transactionReference.trim(),
        paymentStatus: "SUCCESS",
      });
      setSuccess(
        `Payment of ${formatCurrency(payingPolicy.premiumAmount)} recorded for policy ${payingPolicy.policyNumber}.`,
      );
      setPayingPolicy(null);
      refetch();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading your policies..." />;

  return (
    <div>
      <div className="page-header">
        <h1>My Policies</h1>
        <p className="page-subtitle">
          View your policies and complete pending payments
        </p>
      </div>

      <Alert type="error" message={fetchError} />
      <Alert type="error" message={fieldErrors.paymentWindow} onClose={() => clearFieldError("paymentWindow")} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      {data?.content?.length === 0 ? (
        <EmptyState message="You haven't purchased any policies yet." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Plan</th>
                <th>Premium Type</th>
                <th>Coverage</th>
                <th>Premium</th>
                <th>Paid</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((policy) => {
                const annualWindow = getAnnualPaymentWindow(policy);
                return (
                <tr key={policy.policyId}>
                  <td>{policy.policyNumber}</td>

                  <td>{policy.planName}</td>

                  <td>
                    {policy.premiumType === "ANNUAL" ? "Annual" : "One Time"}
                  </td>

                  <td>{formatCurrency(policy.coverageAmount)}</td>

                  <td>
                    {formatCurrency(policy.premiumAmount)}
                    {policy.premiumType === "ANNUAL" ? "/year" : ""}
                  </td>

                  <td>
                    {policy.premiumType === "ANNUAL"
                      ? `${policy.premiumsPaid ?? 0}/${policy.durationYears ?? "-"}`
                      : "-"}
                  </td>

                  <td>
                    {policy.nextPremiumDueDate
                      ? formatDate(policy.nextPremiumDueDate)
                      : "-"}
                  </td>

                  <td>
                    <StatusBadge status={policy.status} />
                    {policy.premiumType === "ANNUAL" && (
                      <div className={`premium-window-note ${annualWindow.allowed ? "" : "locked"}`} style={{ marginTop: "0.35rem" }}>
                        <span>{annualWindow.allowed ? "✅" : "⏳"}</span>
                        {annualWindow.message}
                      </div>
                    )}
                  </td>

                  <td>
                    <Link className="link-btn" to={`/customer/policies/${policy.policyId}`}>
                      View
                    </Link>
                    {(policy.status === "PENDING_PAYMENT" ||
                      (policy.premiumType === "ANNUAL" &&
                        policy.status === "ACTIVE")) && (
                      <button
                        className="link-btn"
                        disabled={!annualWindow.allowed}
                        title={!annualWindow.allowed ? annualWindow.message : "Make annual premium payment"}
                        onClick={() => openPaymentForm(policy)}
                      >
                        Make Payment
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />

      {payingPolicy && (
        <div className="modal-overlay" onClick={() => setPayingPolicy(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Pay for {payingPolicy.policyNumber}</h3>
            <Alert
              type="error"
              message={generalError}
              onClose={() => clearAll()}
            />

            <form onSubmit={handlePaySubmit} noValidate>
              <Input
                label={
                  payingPolicy.premiumType === "ANNUAL"
                    ? "Annual Premium Due"
                    : "Premium Due"
                }
                value={formatCurrency(payingPolicy.premiumAmount)}
                disabled
                helperText={
                  payingPolicy.premiumType === "ANNUAL"
                    ? getAnnualPaymentWindow(payingPolicy).message || "This is your yearly premium amount"
                    : "This is your one-time premium amount"
                }
              />
              <Select
                label="Payment Mode"
                name="paymentMode"
                value={paymentForm.paymentMode}
                onChange={handlePaymentChange}
                error={fieldErrors.paymentMode}
                options={PAYMENT_MODES}
                placeholder="Choose payment mode"
              />
              <Input
                label="Transaction Reference"
                name="transactionReference"
                value={paymentForm.transactionReference}
                onChange={handlePaymentChange}
                error={fieldErrors.transactionReference}
                placeholder="UTR / Transaction ID"
                maxLength={50}
              />
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPayingPolicy(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
