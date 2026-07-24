import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { claimApi } from "../../api/claimApi";
import { policyApi } from "../../api/policyApi";
import { paymentApi } from "../../api/paymentApi";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
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
    to: "/agent/claims",
    icon: "🔎",
    label: "Review Claims",
    desc: "Open your assigned claim queue and submit recommendations.",
    badge: "Queue",
  },
  {
    to: "/agent/policies",
    icon: "📋",
    label: "Policy Registry",
    desc: "Inspect issued policies across customers and coverage types.",
  },
  {
    to: "/agent/payments",
    icon: "💳",
    label: "Payment Monitor",
    desc: "Review recorded payment activity and premium status.",
  },
];

export default function AgentDashboard() {
  const { user } = useAuth();
  const {
    data: claimsData,
    loading: claimsLoading,
    error: claimsError,
  } = useFetch(() => claimApi.getAssignedToMe({ page: 0, size: 100 }), []);
  const {
    data: policiesData,
    loading: policiesLoading,
    error: policiesError,
  } = useFetch(() => policyApi.getAll({ page: 0, size: 100 }), []);
  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
  } = useFetch(() => paymentApi.getAll({ page: 0, size: 100 }), []);

  const claims = claimsData?.content || [];
  const policies = policiesData?.content || [];
  const payments = paymentsData?.content || [];
  const firstName = user?.fullName?.split(" ")?.[0] || "Officer";

  const stats = useMemo(() => {
    const submitted = claims.filter((c) => c.claimStatus === "SUBMITTED");
    const underReview = claims.filter((c) => c.claimStatus === "UNDER_REVIEW");
    const recommended = claims.filter((c) =>
      String(c.claimStatus || "").startsWith("RECOMMENDED"),
    );
    const paymentVolume = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    return { submitted, underReview, recommended, paymentVolume };
  }, [claims, payments]);

  if (claimsLoading || policiesLoading || paymentsLoading)
    return <Loader label="Opening operations workspace..." />;

  return (
    <div className="dashboard-page">
      <div className="dash-hero dashboard-hero-premium agent-hero">
        <div className="hero-copy">
          <span className="eyebrow">Operations Officer Workspace</span>
          <h1>{firstName}, your review cockpit is ready.</h1>
          <p>
            Prioritize claim reviews, inspect policy context, and monitor
            premium activity from one place.
          </p>
          <div className="hero-actions">
            <Link className="hero-btn" to="/agent/claims">
              Open claim queue
            </Link>
            <Link className="hero-btn hero-btn-ghost" to="/agent/policies">
              View policies
            </Link>
          </div>
        </div>
        <div className="hero-orb-card">
          <span>Needs Attention</span>
          <strong>{stats.submitted.length + stats.underReview.length}</strong>
          <p>Claims waiting for operational review</p>
        </div>
      </div>

      <Alert
        type="error"
        message={claimsError || policiesError || paymentsError}
      />

      <div className="metric-grid">
        <MetricCard
          label="Assigned Claims"
          value={claims.length}
          icon="⚖️"
          hint="Total assigned workload"
          tone="blue"
        />
        <MetricCard
          label="New Submissions"
          value={stats.submitted.length}
          icon="📥"
          hint="Waiting to be picked up"
          tone="amber"
        />
        <MetricCard
          label="Under Review"
          value={stats.underReview.length}
          icon="🔬"
          hint="Currently being assessed"
          tone="purple"
        />
        <MetricCard
          label="Payment Volume"
          value={formatCurrency(stats.paymentVolume)}
          icon="₹"
          hint="Recent records visible to you"
          tone="emerald"
        />
      </div>

      <div className="dashboard-two-col">
        <InsightPanel title="Claim pipeline">
          <StatusBreakdown
            items={[
              {
                label: "Submitted",
                value: stats.submitted.length,
                tone: "amber",
              },
              {
                label: "Under Review",
                value: stats.underReview.length,
                tone: "purple",
              },
              {
                label: "Recommended",
                value: stats.recommended.length,
                tone: "blue",
              },
              {
                label: "Closed",
                value: claims.filter((c) =>
                  ["APPROVED", "REJECTED"].includes(c.claimStatus),
                ).length,
                tone: "emerald",
              },
            ]}
          />
        </InsightPanel>
        <InsightPanel title="Priority claim queue">
          <ActivityList
            empty="No assigned claims yet."
            items={claims.slice(0, 6).map((claim) => ({
              id: claim.claimId,
              title: claim.claimNumber || `Claim #${claim.claimId}`,
              meta: `${claim.customerName || "Customer"} · ${formatLabel(claim.claimStatus)} · ${formatDate(claim.incidentDate)}`,
              value: formatCurrency(claim.claimAmount),
              tone: claim.claimStatus === "SUBMITTED" ? "amber" : "blue",
            }))}
          />
        </InsightPanel>
      </div>

      <DashboardSection
        title="Operational shortcuts"
        subtitle="Fast paths for daily insurance operations."
      >
        <div className="action-grid">
          {ACTIONS.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Book of business"
        subtitle="High-level visibility into policies you can inspect."
      >
        <div className="metric-strip">
          <span>
            <strong>{policies.length}</strong> policies visible
          </span>
          <span>
            <strong>
              {policies.filter((p) => p.status === "ACTIVE").length}
            </strong>{" "}
            active
          </span>
          <span>
            <strong>{payments.length}</strong> payment records
          </span>
        </div>
      </DashboardSection>
    </div>
  );
}
