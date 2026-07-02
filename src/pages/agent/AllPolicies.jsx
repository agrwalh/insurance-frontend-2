import { useEffect, useState } from "react";
import { policyApi } from "../../api/policyApi";
import { customerApi } from "../../api/customerApi";
import { planApi } from "../../api/planApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Select from "../../components/common/Select";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";
import { formatCurrency, formatDate } from "../../utils/formatters";
import {
  extractErrorMessage,
  isBlank,
  isFutureOrToday,
} from "../../utils/validators";
import { exportToCsv } from "../../utils/exportCsv";

export default function AllPolicies() {
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [issueForm, setIssueForm] = useState({
    customerId: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [issueErrors, setIssueErrors] = useState({});
  const [issuing, setIssuing] = useState(false);

  const {
    data,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(() => policyApi.getAll({ page, size: 10 }), [page]);

  useEffect(() => {
    if (!showIssueForm) return;
    Promise.all([
      customerApi.getAll({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        direction: "desc",
      }),
      planApi.getActive({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        direction: "desc",
      }),
    ])
      .then(([customerRes, planRes]) => {
        setCustomers(customerRes.data.data.content || []);
        setPlans(planRes.data.data.content || []);
      })
      .catch((err) =>
        setError(
          extractErrorMessage(
            err,
            "Could not load customers/plans for policy issuance.",
          ),
        ),
      );
  }, [showIssueForm]);

  const validateIssueForm = () => {
    const errors = {};
    if (isBlank(issueForm.customerId)) errors.customerId = "Select customer";
    if (isBlank(issueForm.planId)) errors.planId = "Select plan";
    if (isBlank(issueForm.startDate))
      errors.startDate = "Start date is required";
    else if (!isFutureOrToday(issueForm.startDate))
      errors.startDate = "Start date cannot be in the past";
    return errors;
  };

  const handleIssuePolicy = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errors = validateIssueForm();
    setIssueErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIssuing(true);
    try {
      await policyApi.issue({
        customerId: Number(issueForm.customerId),
        planId: Number(issueForm.planId),
        startDate: issueForm.startDate,
      });
      setSuccess("Policy issued successfully. It is now pending payment.");
      setShowIssueForm(false);
      setIssueForm({
        customerId: "",
        planId: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      refetch();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not issue policy."));
    } finally {
      setIssuing(false);
    }
  };

  const handleCancel = async (policyId, policyNumber) => {
    if (
      !window.confirm(`Cancel policy ${policyNumber}? This cannot be undone.`)
    )
      return;

    setError("");
    setSuccess("");
    setCancellingId(policyId);
    try {
      await policyApi.cancel(policyId);
      setSuccess("Policy cancelled.");
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel policy.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader label="Loading policies..." />;

  const policies = data?.content || [];
  const activeCount = policies.filter((policy) => policy.status === "ACTIVE").length;
  const pendingCount = policies.filter((policy) => policy.status === "PENDING_PAYMENT").length;

  return (
    <div className="ops-page">
      <div className="ops-hero policies-hero">
        <div>
          <span className="eyebrow">Policy Registry</span>
          <h1>All Policies</h1>
          <p>Monitor issued policies, premium readiness, customer ownership, and lifecycle status in one clean view.</p>
        </div>
        <div className="ops-hero-panel">
          <strong>{activeCount}</strong>
          <span>active policies</span>
          <p>{pendingCount} currently awaiting payment</p>
        </div>
      </div>

      <div className="page-header ops-toolbar-header">
        <div className="page-header-row">
          <div>
            <p className="page-subtitle">
              Every policy issued across all customers
            </p>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <Button
              variant="secondary"
              onClick={() =>
                exportToCsv("policies", data?.content || [], [
                  { header: "Policy No", value: (p) => p.policyNumber },
                  { header: "Customer", value: (p) => p.customerName },
                  { header: "Plan", value: (p) => p.planName },
                  { header: "Coverage", value: (p) => p.coverageAmount },
                  { header: "Premium", value: (p) => p.premiumAmount },
                  { header: "Start Date", value: (p) => p.startDate },
                  { header: "Status", value: (p) => p.status },
                ])
              }
            >
              Export CSV
            </Button>
            <Button onClick={() => setShowIssueForm(true)}>
              + Issue Policy
            </Button>
          </div>
        </div>
      </div>

      <Alert
        type="error"
        message={error || fetchError}
        onClose={() => setError("")}
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      {policies.length === 0 ? (
        <EmptyState message="No policies found." />
      ) : (
        <div className="table-wrap ops-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Coverage</th>
                <th>Premium</th>
                <th>Start Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.policyId}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.customerName}</td>
                  <td>{policy.planName}</td>
                  <td>{formatCurrency(policy.coverageAmount)}</td>
                  <td>{formatCurrency(policy.premiumAmount)}</td>
                  <td>{formatDate(policy.startDate)}</td>
                  <td>
                    <StatusBadge status={policy.status} />
                  </td>
                  <td>
                    {(policy.status === "ACTIVE" ||
                      policy.status === "PENDING_PAYMENT") && (
                      <button
                        className="link-btn link-btn-danger"
                        disabled={cancellingId === policy.policyId}
                        onClick={() =>
                          handleCancel(policy.policyId, policy.policyNumber)
                        }
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />

      {showIssueForm && (
        <div className="modal-overlay" onClick={() => setShowIssueForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Issue Policy to Customer</h3>
            <p className="form-section-hint">
              Insurance Operations Officer/Admin assisted issuance creates a policy in Pending Payment
              state.
            </p>
            <form onSubmit={handleIssuePolicy} noValidate>
              <Select
                label="Customer"
                value={issueForm.customerId}
                onChange={(e) => {
                  setIssueForm((prev) => ({
                    ...prev,
                    customerId: e.target.value,
                  }));
                  setIssueErrors((prev) => ({ ...prev, customerId: "" }));
                }}
                error={issueErrors.customerId}
                placeholder="Select customer"
                options={customers.map((c) => ({
                  value: c.customerId,
                  label: `${c.fullName} (${c.email})`,
                }))}
              />
              <Select
                label="Active Plan"
                value={issueForm.planId}
                onChange={(e) => {
                  setIssueForm((prev) => ({ ...prev, planId: e.target.value }));
                  setIssueErrors((prev) => ({ ...prev, planId: "" }));
                }}
                error={issueErrors.planId}
                placeholder="Select plan"
                options={plans.map((p) => ({
                  value: p.planId,
                  label: `${p.planName} — ${p.productType} — ${formatCurrency(p.premiumAmount)}`,
                }))}
              />
              <Input
                label="Start Date"
                type="date"
                value={issueForm.startDate}
                onChange={(e) => {
                  setIssueForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }));
                  setIssueErrors((prev) => ({ ...prev, startDate: "" }));
                }}
                error={issueErrors.startDate}
                min={new Date().toISOString().split("T")[0]}
              />
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowIssueForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={issuing}>
                  Issue Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
