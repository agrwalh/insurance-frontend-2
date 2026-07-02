import { useState } from "react";
import { paymentApi } from "../../api/paymentApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDateTime, formatLabel } from "../../utils/formatters";
import { exportToCsv } from "../../utils/exportCsv";

export default function AllPayments() {
  const [page, setPage] = useState(0);

  const { data, loading, error } = useFetch(() => paymentApi.getAll({ page, size: 10 }), [page]);

  if (loading) return <Loader label="Loading payments..." />;

  const payments = data?.content || [];
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="ops-page">
      <div className="ops-hero payments-hero">
        <div>
          <span className="eyebrow">Payment Ledger</span>
          <h1>All Payments</h1>
          <p>Track premium collections, references, payment modes, and confirmation status across policies.</p>
        </div>
        <div className="ops-hero-panel">
          <strong>{formatCurrency(totalAmount)}</strong>
          <span>visible payment volume</span>
          <p>{payments.length} records on this page</p>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="ops-toolbar">
        <button className="btn btn-secondary" onClick={() => exportToCsv("payments", data?.content || [], [
          { header: "Policy", value: (p) => p.policyNumber },
          { header: "Amount", value: (p) => p.amount },
          { header: "Mode", value: (p) => p.paymentMode },
          { header: "Reference", value: (p) => p.transactionReference },
          { header: "Date", value: (p) => p.paymentDate },
          { header: "Status", value: (p) => p.paymentStatus },
        ])}>Export CSV</button>
      </div>

      {payments.length === 0 ? (
        <EmptyState message="No payments recorded yet." />
      ) : (
        <div className="table-wrap ops-table">
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
              {payments.map((payment) => (
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
