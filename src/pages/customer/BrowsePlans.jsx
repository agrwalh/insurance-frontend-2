import { useEffect, useMemo, useState } from "react";
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
  ACTIVE_LIKE_POLICY_STATUSES,
  MAX_PENDING_PAYMENT_POLICIES,
  PRODUCT_POLICY_LIMITS,
} from "../../utils/constants";
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
  const [myPolicies, setMyPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  const {
    data,
    loading,
    error: fetchError,
  } = useFetch(() => planApi.getActive({ page, size: 9 }), [page]);

  useEffect(() => {
    let ignore = false;
    setPoliciesLoading(true);

    policyApi
      .getMyPolicies({ page: 0, size: 100 })
      .then((res) => {
        if (!ignore) setMyPolicies(res.data.data.content || []);
      })
      .catch(() => {
        if (!ignore) {
          setError("Could not verify your existing policies. Please try again.");
        }
      })
      .finally(() => {
        if (!ignore) setPoliciesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const activeLikePolicies = useMemo(
    () =>
      myPolicies.filter((policy) =>
        ACTIVE_LIKE_POLICY_STATUSES.includes(policy.status),
      ),
    [myPolicies],
  );

  const pendingPaymentCount = useMemo(
    () =>
      myPolicies.filter((policy) => policy.status === "PENDING_PAYMENT").length,
    [myPolicies],
  );

  const getPlanEligibility = (plan) => {
    if (policiesLoading) {
      return {
        allowed: false,
        reason: "Checking your existing policies...",
        tone: "neutral",
      };
    }

    const duplicatePlan = activeLikePolicies.find(
      (policy) => String(policy.planId) === String(plan.planId),
    );

    if (duplicatePlan) {
      return {
        allowed: false,
        reason: `You already have this plan ${duplicatePlan.status === "ACTIVE" ? "active" : "awaiting payment"}.`,
        tone: "blocked",
      };
    }

    if (pendingPaymentCount >= MAX_PENDING_PAYMENT_POLICIES) {
      return {
        allowed: false,
        reason: `You already have ${pendingPaymentCount} pending payments. Complete them before buying another plan.`,
        tone: "blocked",
      };
    }

    const productLimit = PRODUCT_POLICY_LIMITS[plan.productType];
    if (productLimit) {
      const sameProductCount = activeLikePolicies.filter(
        (policy) => policy.productType === plan.productType,
      ).length;

      if (sameProductCount >= productLimit) {
        return {
          allowed: false,
          reason: `Standard customers can keep up to ${productLimit} active/pending ${formatLabel(plan.productType)} ${productLimit === 1 ? "policy" : "policies"}. Contact support for additional coverage.`,
          tone: "blocked",
        };
      }
    }

    return {
      allowed: true,
      reason: "Eligible for purchase under standard customer limits.",
      tone: "allowed",
    };
  };

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

    const plan = data?.content?.find((item) => String(item.planId) === String(planId));
    if (!plan) {
      setError("Could not verify this plan. Please refresh and try again.");
      return;
    }

    const eligibility = getPlanEligibility(plan);
    if (!eligibility.allowed) {
      setError(eligibility.reason);
      return;
    }

    setPurchasingId(planId);
    try {
      await policyApi.purchase({ planId, startDate });
      setSuccess(
        "Policy purchased successfully! Go to My Policies to complete payment.",
      );
      const policiesRes = await policyApi.getMyPolicies({ page: 0, size: 100 });
      setMyPolicies(policiesRes.data.data.content || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not purchase this plan."));
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return <Loader label="Loading plans..." />;

  return (
    <div className="marketplace-page">
      <div className="marketplace-hero">
        <div>
          <span className="eyebrow">Plan Marketplace</span>
          <h1>Choose protection that feels simple, clear, and trustworthy.</h1>
          <p>
            Compare coverage, premium style, eligibility, and policy duration before you buy. No confusing steps — just select a start date and choose the right plan.
          </p>
        </div>
        <div className="marketplace-trust-card">
          <strong>{data?.totalElements ?? data?.content?.length ?? 0}</strong>
          <span>available plans</span>
          <p>Eligibility is checked against your existing policies before purchase.</p>
        </div>
      </div>

      <Alert
        type="error"
        message={error || fetchError}
        onClose={() => setError("")}
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="purchase-step-card">
        <div className="step-badge">1</div>
        <div className="purchase-step-copy">
          <h3>Pick your policy start date</h3>
          <p>Plans can start from today up to one year ahead.</p>
        </div>
        <div>
          <input
            type="date"
            className={`form-input ${dateError ? "input-error" : ""}`}
            value={startDate}
            min={TODAY_STR}
            max={MAX_START}
            onChange={handleDateChange}
          />
          {dateError && <span className="field-error">{dateError}</span>}
        </div>
      </div>

      {data?.content?.length === 0 ? (
        <EmptyState message="No active plans available right now." />
      ) : (
        <div className="plan-grid">
          {data?.content?.map((plan) => {
            const imgUrl = PLAN_IMAGES[plan.productType] || PLAN_IMAGES.DEFAULT;
            const eligibility = getPlanEligibility(plan);
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

                <div className="plan-card-body enhanced-plan-body">
                  <div className="plan-card-title-row">
                    <div>
                      <p className="plan-card-name">{plan.planName}</p>
                      <p className="plan-card-product">{plan.productName}</p>
                    </div>
                    <span className="plan-score-pill">Popular</span>
                  </div>

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
                  <div className="plan-benefit-list">
                    <span>✓ Cashless-ready digital purchase</span>
                    <span>✓ Transparent premium and duration</span>
                    <span>✓ Eligibility checked instantly</span>
                  </div>
                  <p className="plan-terms">{plan.termsAndConditions}</p>

                  <p className={`eligibility-note eligibility-${eligibility.tone}`}>
                    {eligibility.tone === "blocked" ? "⚠️ " : "✅ "}
                    {eligibility.reason}
                  </p>

                  <Button
                    fullWidth
                    loading={purchasingId === plan.planId}
                    disabled={!eligibility.allowed || policiesLoading}
                    onClick={() => handlePurchase(plan.planId)}
                  >
                    {eligibility.allowed ? "Purchase Plan" : "Not Eligible"}
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
