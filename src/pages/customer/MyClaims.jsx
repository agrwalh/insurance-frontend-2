import { useState } from "react";
import { Link } from "react-router-dom";
import { claimApi } from "../../api/claimApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function MyClaims() {
  const [page, setPage] = useState(0);

  const { data, loading, error } = useFetch(
    () => claimApi.getMyClaims({ page, size: 10 }),
    [page],
  );

  if (loading) return <Loader label="Loading your claims..." />;

  return (
    <div>
      <div className="page-header">
        <h1>My Claims</h1>
        <p className="page-subtitle">
          Track the status of claims you've submitted
        </p>
      </div>

      <Alert type="error" message={error} />

      {data?.content?.length === 0 ? (
        <EmptyState message="You haven't filed any claims yet." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim No.</th>
                <th>Policy</th>
                <th>Amount</th>
                <th>Incident Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((claim) => (
                <tr key={claim.claimId}>
                  <td>{claim.claimNumber}</td>
                  <td>{claim.policyNumber}</td>
                  <td>{formatCurrency(claim.claimAmount)}</td>
                  <td>{formatDate(claim.incidentDate)}</td>
                  <td>
                    <StatusBadge status={claim.claimStatus} />
                  </td>
                  <td>
                    <Link
                      className="link-btn"
                      to={`/customer/claims/${claim.claimId}`}
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
