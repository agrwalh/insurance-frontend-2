import { useEffect, useMemo, useState } from "react";
import { planApi } from "../../api/planApi";
import { policyApi } from "../../api/policyApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, formatLabel, formatDate } from "../../utils/formatters";
import {
  ACTIVE_LIKE_POLICY_STATUSES,
  MAX_PENDING_PAYMENT_POLICIES,
  PRODUCT_POLICY_LIMITS,
  PREMIUM_FREQUENCIES,
  calculateInstallment,
  getFrequencyBadge,
} from "../../utils/constants";
import {
  isBlank,
  isFutureOrToday,
  toDateOnly,
  extractErrorMessage,
} from "../../utils/validators";

const TODAY_STR = new Date().toISOString().split("T")[0];

// Travel plans: customer can pick a future trip date, capped at ~90 days ahead
const MAX_TRAVEL_START = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myPolicies, setMyPolicies] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  // Frequency chosen per ANNUAL plan (e.g. { planId: "MONTHLY" })
  const [frequencyByPlan, setFrequencyByPlan] = useState({});
  // Trip/start date chosen per TRAVEL plan only
  const [travelDateByPlan, setTravelDateByPlan] = useState({});
  const [travelDateErrorByPlan, setTravelDateErrorByPlan] = useState({});

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

  const handleTravelDateChange = (planId, value) => {
    setTravelDateByPlan((prev) => ({ ...prev, [planId]: value }));
    setTravelDateErrorByPlan((prev) => ({ ...prev, [planId]: "" }));
  };

  // Only TRAVEL plans need date validation — everything else always starts today
  const validateStartDate = (plan) => {
    if (plan.productType !== "TRAVEL") return "";

    const chosen = travelDateByPlan[plan.planId];
    if (isBlank(chosen)) return "Please choose your trip start date.";
    if (!isFutureOrToday(chosen)) return "Start date cannot be in the past.";
    if (toDateOnly(chosen).getTime() > toDateOnly(MAX_TRAVEL_START).getTime())
      return "Trip start date cannot be more than 90 days from today.";
    return "";
  };

  const getStartDateForPlan = (plan) =>
    plan.productType === "TRAVEL" ? travelDateByPlan[plan.planId] : TODAY_STR;

  const handlePurchase = async (planId) => {
    setError("");
    setSuccess("");

    const plan = data?.content?.find((item) => String(item.planId) === String(planId));
    if (!plan) {
      setError("Could not verify this plan. Please refresh and try again.");
      return;
    }

    const dateMsg = validateStartDate(plan);
    if (dateMsg) {
      setTravelDateErrorByPlan((prev) => ({ ...prev, [planId]: dateMsg }));
      return;
    }

    const eligibility = getPlanEligibility(plan);
    if (!eligibility.allowed) {
      setError(eligibility.reason);
      return;
    }

    const chosenFrequency = frequencyByPlan[planId];
    if (plan.premiumType === "ANNUAL" && !chosenFrequency) {
      setError("Please choose a payment frequency (Monthly/Quarterly/Half-Yearly/Annual) for this plan.");
      return;
    }

    setPurchasingId(planId);
    try {
      await policyApi.purchase({
        planId,
        startDate: getStartDateForPlan(plan),
        ...(plan.premiumType === "ANNUAL" ? { premiumFrequency: chosenFrequency } : {}),
      });
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
            Compare coverage, premium style, eligibility, and policy duration before you buy. No confusing steps — just choose the right plan.
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

      {data?.content?.length === 0 ? (
        <EmptyState message="No active plans available right now." />
      ) : (
        <div className="plan-grid">
          {data?.content?.map((plan) => {
            const imgUrl = PLAN_IMAGES[plan.productType] || PLAN_IMAGES.DEFAULT;
            const eligibility = getPlanEligibility(plan);
            const isTravel = plan.productType === "TRAVEL";
            return (
              <div key={plan.planId} className="plan-card">
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

                  {/* EMI frequency picker — only for ANNUAL plans */}
                  {plan.premiumType === "ANNUAL" && (
                    <div className="plan-figures" style={{ marginTop: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <span className="figure-label">Pay As</span>
                        <select
                          className="form-input"
                          value={frequencyByPlan[plan.planId] || ""}
                          onChange={(e) =>
                            setFrequencyByPlan((prev) => ({ ...prev, [plan.planId]: e.target.value }))
                          }
                        >
                          <option value="">Choose EMI frequency</option>
                          {PREMIUM_FREQUENCIES.map((freq) => (
                            <option key={freq} value={freq}>
                              {formatLabel(freq)}
                            </option>
                          ))}
                        </select>
                        {frequencyByPlan[plan.planId] && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              marginTop: "0.25rem",
                              display: "inline-block",
                              color:
                                getFrequencyBadge(frequencyByPlan[plan.planId]).tone === "discount"
                                  ? "green"
                                  : getFrequencyBadge(frequencyByPlan[plan.planId]).tone === "loading"
                                  ? "#b45309"
                                  : "gray",
                            }}
                          >
                            {getFrequencyBadge(frequencyByPlan[plan.planId]).text}
                          </span>
                        )}
                      </div>
                      {frequencyByPlan[plan.planId] && (
                        <div>
                          <span className="figure-label">Installment</span>
                          <span className="figure-value">
                            {formatCurrency(
                              calculateInstallment(plan.premiumAmount, frequencyByPlan[plan.planId]),
                            )}
                            {frequencyByPlan[plan.planId] !== "ANNUAL"
                              ? ` / ${formatLabel(frequencyByPlan[plan.planId]).toLowerCase()}`
                              : " / year"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Start date — only TRAVEL lets the customer choose; everything else starts today */}
                  <div style={{ marginTop: "0.5rem" }}>
                    {isTravel ? (
                      <>
                        <span className="figure-label">Trip Start Date</span>
                        <input
                          type="date"
                          className={`form-input ${travelDateErrorByPlan[plan.planId] ? "input-error" : ""}`}
                          value={travelDateByPlan[plan.planId] || ""}
                          min={TODAY_STR}
                          max={MAX_TRAVEL_START}
                          onChange={(e) => handleTravelDateChange(plan.planId, e.target.value)}
                        />
                        {travelDateErrorByPlan[plan.planId] && (
                          <span className="field-error">{travelDateErrorByPlan[plan.planId]}</span>
                        )}
                      </>
                    ) : (
                      <p className="plan-meta" style={{ margin: 0 }}>
                        📅 Your policy will start today — {formatDate(TODAY_STR)}
                      </p>
                    )}
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