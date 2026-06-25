import { useState } from "react";
import { paymentApi } from "../../api/paymentApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDateTime, formatLabel } from "../../utils/formatters";

export default function AllPayments() {
  const [page, setPage] = useState(0);

  const { data, loading, error } = useFetch(() => paymentApi.getAll({ page, size: 10 }), [page]);

  if (loading) return <Loader label="Loading payments..." />;

  return (
    <div>
      <div className="page-header">
        <h1>All Payments</h1>
        <p className="page-subtitle">Payment records across all policies</p>
      </div>

      <Alert type="error" message={error} />

      {data?.content?.length === 0 ? (
        <EmptyState message="No payments recorded yet." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.policyNumber}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{formatLabel(payment.paymentMode)}</td>
                  <td>{payment.transactionReference}</td>
                  <td>{formatDateTime(payment.paymentDate)}</td>
                  <td><StatusBadge status={payment.paymentStatus} /></td>
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
