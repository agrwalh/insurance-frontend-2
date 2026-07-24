import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { productApi } from "../../api/productApi";
import { planApi } from "../../api/planApi";
import { policyApi } from "../../api/policyApi";
import { claimApi } from "../../api/claimApi";
import { paymentApi } from "../../api/paymentApi";
import { userApi } from "../../api/userApi";
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
    to: "/admin/products",
    icon: "📦",
    label: "Product Studio",
    desc: "Create and manage insurance product categories.",
    badge: "Core",
  },
  {
    to: "/admin/plans",
    icon: "🗂️",
    label: "Plan Builder",
    desc: "Control coverages, premiums, duration and terms.",
  },
  {
    to: "/admin/claims",
    icon: "⚖️",
    label: "Claim Decisions",
    desc: "Finalize officer-reviewed claim recommendations.",
    badge: "Decision",
  },
  {
    to: "/admin/users",
    icon: "👥",
    label: "User Control",
    desc: "Create officers, review customers and manage access.",
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
  } = useFetch(() => productApi.getAll({ page: 0, size: 100 }), []);
  const {
    data: plansData,
    loading: plansLoading,
    error: plansError,
  } = useFetch(() => planApi.getActive({ page: 0, size: 100 }), []);
  const {
    data: policiesData,
    loading: policiesLoading,
    error: policiesError,
  } = useFetch(() => policyApi.getAll({ page: 0, size: 100 }), []);
  const {
    data: claimsData,
    loading: claimsLoading,
    error: claimsError,
  } = useFetch(() => claimApi.getAll({ page: 0, size: 100 }), []);
  const {
    data: paymentsData,
    loading: paymentsLoading,
    error: paymentsError,
  } = useFetch(() => paymentApi.getAll({ page: 0, size: 100 }), []);
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useFetch(() => userApi.getAll({ page: 0, size: 100 }), []);

  const products = productsData?.content || [];
  const plans = plansData?.content || [];
  const policies = policiesData?.content || [];
  const claims = claimsData?.content || [];
  const payments = paymentsData?.content || [];
  const users = usersData?.content || [];
  const firstName = user?.fullName?.split(" ")?.[0] || "Admin";

  const stats = useMemo(() => {
    const revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingDecisions = claims.filter((c) =>
      [
        "RECOMMENDED_FOR_APPROVAL",
        "RECOMMENDED_FOR_REJECTION",
        "UNDER_REVIEW",
      ].includes(c.claimStatus),
    );
    const activeUsers = users.filter((u) => u.isActive);
    const activePolicies = policies.filter((p) => p.status === "ACTIVE");
    return { revenue, pendingDecisions, activeUsers, activePolicies };
  }, [payments, claims, users, policies]);

  if (
    productsLoading ||
    plansLoading ||
    policiesLoading ||
    claimsLoading ||
    paymentsLoading ||
    usersLoading
  ) {
    return <Loader label="Building admin intelligence console..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="dash-hero dashboard-hero-premium admin-hero">
        <div className="hero-copy">
          <span className="eyebrow">SecureCover Admin Console</span>
          <h1>{firstName}, your platform overview is live.</h1>
          <p>
            Monitor growth, product readiness, claim decisions, users and
            payment flow with executive clarity.
          </p>
          <div className="hero-actions">
            <Link className="hero-btn" to="/admin/claims">
              Review decisions
            </Link>
            <Link
              className="hero-btn hero-btn-ghost"
              to="/admin/business-tools"
            >
              Open tools
            </Link>
          </div>
        </div>
        <div className="hero-orb-card">
          <span>Platform Revenue</span>
          <strong>{formatCurrency(stats.revenue)}</strong>
          <p>Based on visible payment records</p>
        </div>
      </div>

      <Alert
        type="error"
        message={
          productsError ||
          plansError ||
          policiesError ||
          claimsError ||
          paymentsError ||
          usersError
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Products / Plans"
          value={`${products.length}/${plans.length}`}
          icon="📦"
          hint="Catalog readiness"
          tone="blue"
        />
        <MetricCard
          label="Active Policies"
          value={stats.activePolicies.length}
          icon="🛡️"
          hint="Live customer protection"
          tone="emerald"
        />
        <MetricCard
          label="Decision Queue"
          value={stats.pendingDecisions.length}
          icon="⚖️"
          hint="Claims requiring attention"
          tone="amber"
        />
        <MetricCard
          label="Active Users"
          value={stats.activeUsers.length}
          icon="👥"
          hint={`${users.length} total accounts`}
          tone="purple"
        />
      </div>

      <div className="dashboard-two-col">
        <InsightPanel title="Claim decision pipeline">
          <StatusBreakdown
            items={[
              {
                label: "Submitted",
                value: claims.filter((c) => c.claimStatus === "SUBMITTED")
                  .length,
                tone: "amber",
              },
              {
                label: "Under Review",
                value: claims.filter((c) => c.claimStatus === "UNDER_REVIEW")
                  .length,
                tone: "purple",
              },
              {
                label: "Recommended",
                value: claims.filter((c) =>
                  String(c.claimStatus || "").startsWith("RECOMMENDED"),
                ).length,
                tone: "blue",
              },
              {
                label: "Finalized",
                value: claims.filter((c) =>
                  ["APPROVED", "REJECTED"].includes(c.claimStatus),
                ).length,
                tone: "emerald",
              },
            ]}
          />
        </InsightPanel>
        <InsightPanel title="Recent claim activity">
          <ActivityList
            empty="No claims have entered the platform yet."
            items={claims.slice(0, 6).map((claim) => ({
              id: claim.claimId,
              title: claim.claimNumber || `Claim #${claim.claimId}`,
              meta: `${claim.customerName || "Customer"} · ${formatLabel(claim.claimStatus)} · ${formatDate(claim.createdAt)}`,
              value: formatCurrency(claim.claimAmount),
              tone: ["APPROVED"].includes(claim.claimStatus)
                ? "emerald"
                : claim.claimStatus === "REJECTED"
                  ? "red"
                  : "amber",
            }))}
          />
        </InsightPanel>
      </div>

      <DashboardSection
        title="Management cockpit"
        subtitle="Key admin areas redesigned as action-oriented cards."
      >
        <div className="action-grid">
          {ACTIONS.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Platform health"
        subtitle="A compact operational summary from existing backend data."
      >
        <div className="metric-strip">
          <span>
            <strong>{products.filter((p) => p.isActive).length}</strong> active
            products
          </span>
          <span>
            <strong>
              {policies.filter((p) => p.status === "PENDING_PAYMENT").length}
            </strong>{" "}
            policies awaiting payment
          </span>
          <span>
            <strong>{users.filter((u) => u.role === "AGENT").length}</strong>{" "}
            officers onboarded
          </span>
          <span>
            <strong>{payments.length}</strong> payments recorded
          </span>
        </div>
      </DashboardSection>
    </div>
  );
}
