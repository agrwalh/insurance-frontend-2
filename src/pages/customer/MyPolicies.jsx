import { useState } from "react";
import { Link } from "react-router-dom";
import { policyApi } from "../../api/policyApi";
import { paymentApi } from "../../api/paymentApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate, formatLabel } from "../../utils/formatters";
import { useFormErrors } from "../../hooks/useFormErrors";
import { extractErrorMessage } from "../../utils/validators";

function getAnnualPaymentWindow(policy) {
  if (policy.premiumType !== "ANNUAL") {
    return { allowed: true, message: "" };
  }

  if ((policy.premiumsPaid ?? 0) >= (policy.totalInstallmentsDue ?? 0)) {
    return {
      allowed: false,
      message: "All premium installments are already paid.",
    };
  }

  if (policy.status === "PENDING_PAYMENT" || (policy.premiumsPaid ?? 0) === 0) {
    return {
      allowed: true,
      message: "First installment is due now to activate your policy.",
    };
  }

  if (!policy.nextPremiumDueDate) {
    return {
      allowed: false,
      message: "Next premium due date is not available.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(policy.nextPremiumDueDate);
  dueDate.setHours(0, 0, 0, 0);

  // Window opens proportionally to the installment cycle length (1 week per month of the cycle)
const paymentWindowDays = {
  MONTHLY: 5,
  QUARTERLY: 10,
  HALF_YEARLY: 15,
  ANNUAL: 30,
};

const windowDays =
  paymentWindowDays[policy.premiumFrequency] ?? 5;

  const windowStart = new Date(dueDate);
  windowStart.setDate(windowStart.getDate() - windowDays);

  if (today < windowStart) {
    return {
      allowed: false,
      message: `Next installment opens on ${formatDate(windowStart)}. Due date: ${formatDate(policy.nextPremiumDueDate)}.`,
    };
  }

  return {
    allowed: true,
    message: `Payment window is open. Due date: ${formatDate(policy.nextPremiumDueDate)}.`,
  };
}

export default function MyPolicies() {
  const [page, setPage] = useState(0);
  const [payingPolicy, setPayingPolicy] = useState(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { fieldErrors, setFieldError, clearFieldError, clearAll } = useFormErrors();

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
    setError("");
    clearAll();
    setSuccess("");
  };

  const handlePayWithRazorpay = async (policy) => {
    setError("");
    setGatewayLoading(true);
    try {
      const orderRes = await paymentApi.createRazorpayOrder(policy.policyId);
      const order = orderRes.data.data;

      const options = {
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: "Insurance Policy Management",
        description: `Premium payment for ${order.policyNumber}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone,
        },
        theme: { color: "#2563eb" },
        handler: async function (response) {
          try {
            await paymentApi.verifyRazorpayPayment({
              policyId: policy.policyId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccess(
              `Payment of ${formatCurrency(order.amount)} verified and recorded for ${order.policyNumber}.`,
            );
            setPayingPolicy(null);
            refetch();
          } catch (err) {
            setError(
              extractErrorMessage(
                err,
                "Payment succeeded but verification failed. Contact support with your payment ID.",
              ),
            );
          }
        },
        modal: {
          ondismiss: function () {
            setError("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not start payment. Please try again."));
    } finally {
      setGatewayLoading(false);
    }
  };

  if (loading) return <Loader label="Loading your policies..." />;

  return (
    <div>
      <div className="page-header">
        <h1>My Policies</h1>
        <p className="page-subtitle">View your policies and complete pending payments</p>
      </div>

      <Alert type="error" message={fetchError || error} onClose={() => setError("")} />
      <Alert
        type="error"
        message={fieldErrors.paymentWindow}
        onClose={() => clearFieldError("paymentWindow")}
      />
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
                    <td>{policy.premiumType === "ANNUAL" ? "Annual" : "One Time"}</td>
                    <td>{formatCurrency(policy.coverageAmount)}</td>
                    <td>
                      {formatCurrency(policy.installmentAmount ?? policy.premiumAmount)}
                      {policy.premiumType === "ANNUAL"
                        ? ` / ${(policy.premiumFrequency || "").toLowerCase()}`
                        : ""}
                    </td>
                    <td>
                      {policy.premiumType === "ANNUAL"
                        ? `${policy.premiumsPaid ?? 0}/${policy.totalInstallmentsDue ?? "-"}`
                        : "-"}
                    </td>
                    <td>{policy.nextPremiumDueDate ? formatDate(policy.nextPremiumDueDate) : "-"}</td>
                    <td>
                      <StatusBadge status={policy.status} />
                      {policy.premiumType === "ANNUAL" && (
                        <div
                          className={`premium-window-note ${annualWindow.allowed ? "" : "locked"}`}
                          style={{ marginTop: "0.35rem" }}
                        >
                          <span>{annualWindow.allowed ? "✅" : "⏳"}</span>
                          {annualWindow.message}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="policy-actions">
                        <Link className="link-btn" to={`/customer/policies/${policy.policyId}`}>
                          View
                        </Link>

                        {(policy.status === "PENDING_PAYMENT" ||
                          (policy.premiumType === "ANNUAL" && policy.status === "ACTIVE")) && (
                          <button
                            className="link-btn"
                            disabled={!annualWindow.allowed}
                            title={!annualWindow.allowed ? annualWindow.message : "Make premium payment"}
                            onClick={() => openPaymentForm(policy)}
                          >
                            Make Payment
                          </button>
                        )}
                      </div>
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
            <Alert type="error" message={error} onClose={() => setError("")} />

            <Input
              label={
                payingPolicy.premiumType === "ANNUAL"
                  ? `${formatLabel(payingPolicy.premiumFrequency)} Installment Due`
                  : "Premium Due"
              }
              value={formatCurrency(payingPolicy.installmentAmount)}
              disabled
              helperText={
                payingPolicy.premiumType === "ANNUAL"
                  ? getAnnualPaymentWindow(payingPolicy).message || "This is your EMI installment amount"
                  : "This is your one-time premium amount"
              }
            />

            <div style={{ marginTop: "1rem" }}>
              <p className="field-hint" style={{ marginBottom: "0.75rem" }}>
                You'll be redirected to a secure Razorpay checkout to complete this payment via UPI, Card, or Net Banking.
              </p>
              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setPayingPolicy(null)}>
                  Cancel
                </Button>
                <Button
                  loading={gatewayLoading}
                  onClick={() => handlePayWithRazorpay(payingPolicy)}
                >
                  Pay {formatCurrency(payingPolicy.installmentAmount)} Securely
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}