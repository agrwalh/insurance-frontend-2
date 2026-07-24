import { useState } from "react";
import { Link } from "react-router-dom";
import { claimApi } from "../../api/claimApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Select from "../../components/common/Select";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { CLAIM_STATUSES } from "../../utils/constants";
import { exportToCsv } from "../../utils/exportCsv";

export default function AdminClaims() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, loading, error } = useFetch(
    () =>
      claimApi.getAll({ page, size: 10, status: statusFilter || undefined }),
    [page, statusFilter],
  );

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  if (loading) return <Loader label="Loading claims..." />;

  const claims = data?.content || [];
  const decisionReady = claims.filter((claim) =>
    String(claim.claimStatus || "").startsWith("RECOMMENDED"),
  ).length;

  return (
    <div className="ops-page">
      <div className="ops-hero claims-hero">
        <div>
          <span className="eyebrow">Decision Desk</span>
          <h1>Claims</h1>
          <p>
            Review claim movement, filter by status, and make final decisions
            with clear operational context.
          </p>
        </div>
        <div className="ops-hero-panel">
          <strong>{decisionReady}</strong>
          <span>ready for decision</span>
          <p>{claims.length} claims visible on this page</p>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="ops-toolbar split-toolbar">
        <div className="filter-bar">
          <Select
            name="status"
            value={statusFilter}
            onChange={handleFilterChange}
            options={CLAIM_STATUSES}
            placeholder="All statuses"
          />
        </div>

        <button
          className="btn btn-secondary"
          onClick={() =>
            exportToCsv("claims", data?.content || [], [
              { header: "Claim No", value: (c) => c.claimNumber },
              { header: "Customer", value: (c) => c.customerName },
              { header: "Policy", value: (c) => c.policyNumber },
              { header: "Amount", value: (c) => c.claimAmount },
              { header: "Incident Date", value: (c) => c.incidentDate },
              { header: "Status", value: (c) => c.claimStatus },
              {
                header: "Assigned Insurance Operations Officer",
                value: (c) => c.assignedAgentName || "",
              },
            ])
          }
        >
          Export CSV
        </button>
      </div>

      {claims.length === 0 ? (
        <EmptyState message="No claims match this filter." />
      ) : (
        <div className="table-wrap ops-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim No.</th>
                <th>Customer</th>
                <th>Policy</th>
                <th>Amount</th>
                <th>Incident Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.claimId}>
                  <td>{claim.claimNumber}</td>
                  <td>{claim.customerName}</td>
                  <td>{claim.policyNumber}</td>
                  <td>{formatCurrency(claim.claimAmount)}</td>
                  <td>{formatDate(claim.incidentDate)}</td>
                  <td>
                    <StatusBadge status={claim.claimStatus} />
                  </td>
                  <td>
                    <Link
                      className="link-btn"
                      to={`/admin/claims/${claim.claimId}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />
    </div>
  );
}
