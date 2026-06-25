import { useState } from "react";
import { planApi } from "../../api/planApi";
import { policyApi } from "../../api/policyApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, formatLabel } from "../../utils/formatters";
import {
  isBlank,
  isFutureOrToday,
  toDateOnly,
  extractErrorMessage,
} from "../../utils/validators";

const TODAY_STR = new Date().toISOString().split("T")[0];
const MAX_START = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
})();

const PLAN_IMAGES = {
  HEALTH:
    "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=600&q=75&auto=format&fit=crop",
  MOTOR:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=75&auto=format&fit=crop",
  LIFE: "https://images.unsplash.com/photo-1517554558809-9b4971b38f39?q=80&w=2304&auto=format&fit=crop",
  TRAVEL:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=75&auto=format&fit=crop",
  DEFAULT:
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=75&auto=format&fit=crop",
};

export default function BrowsePlans() {
  const [page, setPage] = useState(0);
  const [purchasingId, setPurchasingId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data,
    loading,
    error: fetchError,
  } = useFetch(() => planApi.getActive({ page, size: 9 }), [page]);

  const handleDateChange = (e) => {
    setStartDate(e.target.value);
    setDateError("");
  };

  const validateDate = () => {
    if (isBlank(startDate)) return "Please choose a policy start date first.";
    if (!isFutureOrToday(startDate)) return "Start date cannot be in the past.";
    if (toDateOnly(startDate).getTime() > toDateOnly(MAX_START).getTime())
      return "Start date cannot be more than a year from today.";
    return "";
  };

  const handlePurchase = async (planId) => {
    setError("");
    setSuccess("");
    const msg = validateDate();
    if (msg) {
      setDateError(msg);
      return;
    }
    setPurchasingId(planId);
    try {
      await policyApi.purchase({ planId, startDate });
      setSuccess(
        "Policy purchased successfully! Go to My Policies to complete payment.",
      );
    } catch (err) {
      setError(extractErrorMessage(err, "Could not purchase this plan."));
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return <Loader label="Loading plans..." />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Insurance Plans</h1>
            <p className="page-subtitle">
              Choose the plan that best fits your needs
            </p>
          </div>
        </div>
      </div>

      <Alert
        type="error"
        message={error || fetchError}
        onClose={() => setError("")}
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          flexWrap: "wrap",
          boxShadow: "var(--sh-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📅</span>
          <span
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "var(--slate-700)",
            }}
          >
            Policy Start Date
          </span>
        </div>
        <div>
          <input
            type="date"
            className={`form-input ${dateError ? "input-error" : ""}`}
            value={startDate}
            min={TODAY_STR}
            max={MAX_START}
            onChange={handleDateChange}
            style={{ width: "auto", minWidth: "180px" }}
          />
          {dateError && <span className="field-error">{dateError}</span>}
        </div>
        <span style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
          Set a start date, then click Purchase on any plan below
        </span>
      </div>

      {data?.content?.length === 0 ? (
        <EmptyState message="No active plans available right now." />
      ) : (
        <div className="plan-grid">
          {data?.content?.map((plan) => {
            const imgUrl = PLAN_IMAGES[plan.productType] || PLAN_IMAGES.DEFAULT;
            return (
              <div key={plan.planId} className="plan-card">
                {/* Photographic top strip */}
                <div
                  className="plan-card-image"
                  style={{ backgroundImage: `url('${imgUrl}')` }}
                >
                  <span className="plan-card-type">
                    {formatLabel(plan.productType)}
                  </span>
                </div>

                <div className="plan-card-body">
                  <p className="plan-card-name">{plan.planName}</p>
                  <p className="plan-card-product">{plan.productName}</p>

                  <div className="plan-figures">
                    <div>
                      <span className="figure-label">Coverage</span>
                      <span className="figure-value">
                        {formatCurrency(plan.coverageAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="figure-label">Premium</span>
                      <span className="figure-value">
                        {formatCurrency(plan.premiumAmount)}
                        {plan.premiumType === "ANNUAL" ? "/year" : ""}
                      </span>
                    </div>
                  </div>

                  <p className="plan-meta">
                    {plan.premiumType === "ANNUAL"
                      ? "Annual Premium"
                      : "One Time Payment"}
                    &nbsp;·&nbsp;
                    {plan.durationYears} year{plan.durationYears > 1 ? "s" : ""}
                  </p>
                  <p className="plan-terms">{plan.termsAndConditions}</p>

                  <Button
                    fullWidth
                    loading={purchasingId === plan.planId}
                    onClick={() => handlePurchase(plan.planId)}
                  >
                    Purchase Plan
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />
    </div>
  );
}
