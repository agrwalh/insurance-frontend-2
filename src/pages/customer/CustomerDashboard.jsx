import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { policyApi } from "../../api/policyApi";
import { claimApi } from "../../api/claimApi";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import StatusBadge from "../../components/common/StatusBadge";
import {
  formatCurrency,
  formatDate,
  formatLabel,
} from "../../utils/formatters";
import {
  ActionCard,
  ActivityList,
  DashboardSection,
  InsightPanel,
  MetricCard,
  StatusBreakdown,
} from "../../components/dashboard/DashboardWidgets";

const ACTIONS = [
  {
    to: "/customer/plans",
    icon: "🛡️",
    label: "Explore Plans",
    desc: "Compare curated covers for health, motor, life and travel.",
    badge: "Shop",
  },
  {
    to: "/customer/policies",
    icon: "💳",
    label: "Pay Premium",
    desc: "Clear pending or annual premium payments securely.",
    badge: "Due",
  },
  {
    to: "/customer/claims/new",
    icon: "📝",
    label: "File a Claim",
    desc: "Start a guided claim request with documents and policy checks.",
  },
  {
    to: "/customer/profile",
    icon: "👤",
    label: "Complete Profile",
    desc: "Keep nominee and address details ready for faster service.",
  },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const {
    data: policiesData,
    loading: policiesLoading,
    error: policiesError,
  } = useFetch(() => policyApi.getMyPolicies({ page: 0, size: 100 }), []);
  const {
    data: claimsData,
    loading: claimsLoading,
    error: claimsError,
  } = useFetch(() => claimApi.getMyClaims({ page: 0, size: 100 }), []);

  const policies = policiesData?.content || [];
  const claims = claimsData?.content || [];
  const firstName = user?.fullName?.split(" ")?.[0] || "there";

  const stats = useMemo(() => {
    const activePolicies = policies.filter((p) => p.status === "ACTIVE");
    const pendingPayments = policies.filter(
      (p) => p.status === "PENDING_PAYMENT",
    );
    const openClaims = claims.filter(
      (c) => !["APPROVED", "REJECTED"].includes(c.claimStatus),
    );
    const totalCoverage = activePolicies.reduce(
      (sum, p) => sum + Number(p.coverageAmount || 0),
      0,
    );
    const hasCoreCoverage = activePolicies.some((p) =>
      ["HEALTH", "LIFE"].includes(p.productType),
    );
    const hasMultiplePolicies = activePolicies.length >= 2;
    const hasNoPendingPayments =
      policies.length > 0 && pendingPayments.length === 0;
    const hasClaimTracking = claims.length > 0;
    const protectionScore = Math.min(
      100,
      (activePolicies.length > 0 ? 30 : 0) +
        (hasCoreCoverage ? 25 : 0) +
        (hasNoPendingPayments ? 20 : 0) +
        (hasMultiplePolicies ? 15 : 0) +
        (hasClaimTracking ? 10 : 0),
    );
    return {
      activePolicies,
      pendingPayments,
      openClaims,
      totalCoverage,
      protectionScore,
    };
  }, [policies, claims]);

  if (policiesLoading || claimsLoading)
    return <Loader label="Preparing your insurance command center..." />;

  return (
    <div className="dashboard-page">
      <div className="dash-hero dashboard-hero-premium customer-hero">
        <div className="hero-copy">
          <span className="eyebrow">Personal Protection Hub</span>
          <h1>Good to see you, {firstName}. Your cover is in focus.</h1>
          <p>
            Track policies, premium windows, claims and next actions from one
            polished dashboard.
          </p>
          <div className="hero-actions">
            <Link className="hero-btn" to="/customer/plans">
              Find new protection
            </Link>
            <Link className="hero-btn hero-btn-ghost" to="/customer/claims/new">
              Start claim
            </Link>
          </div>
        </div>
        <div className="hero-orb-card">
          <span>Protection Score</span>
          <strong>{stats.protectionScore}%</strong>
          <p>
            {stats.activePolicies.length
              ? "Based on active cover, payment health, core protection and claim readiness"
              : "Buy your first policy to activate cover"}
          </p>
        </div>
      </div>

      <Alert type="error" message={policiesError || claimsError} />

      <div className="metric-grid">
        <MetricCard
          label="Active Policies"
          value={stats.activePolicies.length}
          icon="🛡️"
          hint="Currently protecting you"
          tone="emerald"
        />
        <MetricCard
          label="Total Coverage"
          value={formatCurrency(stats.totalCoverage)}
          icon="₹"
          hint="Across active policies"
          tone="blue"
        />
        <MetricCard
          label="Pending Payments"
          value={stats.pendingPayments.length}
          icon="💳"
          hint="Premium actions waiting"
          tone="amber"
        />
        <MetricCard
          label="Open Claims"
          value={stats.openClaims.length}
          icon="⚕️"
          hint="Being processed or reviewed"
          tone="purple"
        />
      </div>

      <div className="dashboard-two-col">
        <InsightPanel title="Policy health">
          <StatusBreakdown
            items={[
              {
                label: "Active",
                value: policies.filter((p) => p.status === "ACTIVE").length,
                tone: "emerald",
              },
              {
                label: "Pending Payment",
                value: policies.filter((p) => p.status === "PENDING_PAYMENT")
                  .length,
                tone: "amber",
              },
              {
                label: "Other",
                value: policies.filter(
                  (p) => !["ACTIVE", "PENDING_PAYMENT"].includes(p.status),
                ).length,
                tone: "grey",
              },
            ]}
          />
        </InsightPanel>
        <InsightPanel title="Recent claim movement">
          <ActivityList
            empty="No claims filed yet. You can file one whenever an active policy needs support."
            items={claims.slice(0, 5).map((claim) => ({
              id: claim.claimId,
              title: claim.claimNumber || `Claim #${claim.claimId}`,
              meta: `${formatLabel(claim.claimStatus)} · Incident ${formatDate(claim.incidentDate)}`,
              value: formatCurrency(claim.claimAmount),
              tone:
                claim.claimStatus === "APPROVED"
                  ? "emerald"
                  : claim.claimStatus === "REJECTED"
                    ? "red"
                    : "amber",
            }))}
          />
        </InsightPanel>
      </div>

      <DashboardSection
        title="Priority actions"
        subtitle="Designed around the next thing you may need to do."
      >
        <div className="action-grid">
          {ACTIONS.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Portfolio snapshot"
        subtitle="Your most recent policies and statuses."
      >
        <div className="table-wrap elevated-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Plan</th>
                <th>Coverage</th>
                <th>Premium</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.slice(0, 5).map((policy) => (
                <tr key={policy.policyId}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.planName}</td>
                  <td>{formatCurrency(policy.coverageAmount)}</td>
                  <td>{formatCurrency(policy.premiumAmount)}</td>
                  <td>
                    <StatusBadge status={policy.status} />
                  </td>
                </tr>
              ))}
              {policies.length === 0 && (
                <tr>
                  <td colSpan="5">
                    No policies yet. Browse plans to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
