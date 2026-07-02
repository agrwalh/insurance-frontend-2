import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { policyApi } from "../../api/policyApi";
import { paymentApi } from "../../api/paymentApi";
import { customerApi } from "../../api/customerApi";
import { claimApi } from "../../api/claimApi";
import { settlementApi } from "../../api/settlementApi";
import Alert from "../../components/common/Alert";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "../../utils/formatters";

function buildAnnualSchedule(policy) {
  if (policy.premiumType !== "ANNUAL") return [];
  const duration = Number(policy.durationYears || 0);
  const start = policy.startDate ? new Date(policy.startDate) : null;
  if (!duration || !start || Number.isNaN(start.getTime())) return [];

  const paid = Number(policy.premiumsPaid || 0);
  return Array.from({ length: duration }, (_, index) => {
    const due = new Date(start);
    due.setFullYear(start.getFullYear() + index);
    const installment = index + 1;
    return {
      installment,
      dueDate: due.toISOString(),
      status: installment <= paid ? "Paid" : installment === paid + 1 ? "Next Due" : "Upcoming",
    };
  });
}

export default function PolicyDetail() {
  const { policyId } = useParams();
  const [policy, setPolicy] = useState(null);
  const [payments, setPayments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimSettlements, setClaimSettlements] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [policyRes, paymentsRes, profileRes, claimsRes] = await Promise.allSettled([
          policyApi.getById(policyId),
          paymentApi.getMyPayments(policyId, { page: 0, size: 50 }),
          customerApi.getMyProfile(),
          claimApi.getMyClaims({ page: 0, size: 100 }),
        ]);

        if (policyRes.status !== "fulfilled") throw policyRes.reason;
        setPolicy(policyRes.value.data.data);

        if (paymentsRes.status === "fulfilled") {
          setPayments(paymentsRes.value.data.data.content || []);
        }
        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data.data);
        }
        if (claimsRes.status === "fulfilled") {
          const fetchedClaims = claimsRes.value.data.data.content || [];
          setClaims(fetchedClaims);

          const settlementResults = await Promise.allSettled(
            fetchedClaims
              .filter((claim) => claim.claimStatus !== "REJECTED")
              .map((claim) => settlementApi.getByClaim(claim.claimId).then((res) => [claim.claimId, res.data.data]))
          );

          const settlementMap = {};
          settlementResults.forEach((result) => {
            if (result.status === "fulfilled") {
              const [claimId, settlement] = result.value;
              settlementMap[claimId] = settlement;
            }
          });
          setClaimSettlements(settlementMap);
        }
      } catch {
        setError("Could not load policy details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [policyId]);

  const schedule = useMemo(() => buildAnnualSchedule(policy || {}), [policy]);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const policyClaims = claims.filter((claim) => String(claim.policyId) === String(policy?.policyId || policy?.id || policyId));
  const reservedClaimAmount = policyClaims
    .filter((claim) => claim.claimStatus !== "REJECTED")
    .reduce((sum, claim) => {
      const settlement = claimSettlements[claim.claimId];
      return sum + Number(settlement?.approvedAmount ?? claim.claimAmount ?? 0);
    }, 0);
  const remainingCoverage = Math.max(0, Number(policy?.coverageAmount || 0) - reservedClaimAmount);

  const printCertificate = () => window.print();

  if (loading) return <Loader label="Preparing policy certificate..." />;
  if (!policy) return <EmptyState message="Policy not found." />;

  return (
    <div className="policy-detail-page">
      <div className="policy-detail-hero">
        <div>
          <Link className="link-btn" to="/customer/policies">← Back to policies</Link>
          <span className="eyebrow">Policy Certificate</span>
          <h1>{policy.planName}</h1>
          <p>Policy {policy.policyNumber} · {formatLabel(policy.productType)} protection</p>
        </div>
        <div className="policy-hero-actions">
          <StatusBadge status={policy.status} />
          <button className="hero-btn" type="button" onClick={printCertificate}>Print / Save PDF</button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />

      <section className="certificate-sheet">
        <div className="certificate-header">
          <div>
            <span className="certificate-mark">SC</span>
            <strong>SecureCover Policy Certificate</strong>
          </div>
          <span>{policy.policyNumber}</span>
        </div>

        <div className="certificate-grid">
          <div><span>Customer</span><strong>{policy.customerName || "Policy Holder"}</strong></div>
          <div><span>Plan</span><strong>{policy.planName}</strong></div>
          <div><span>Coverage</span><strong>{formatCurrency(policy.coverageAmount)}</strong></div>
          <div><span>Premium</span><strong>{formatCurrency(policy.premiumAmount)} {policy.premiumType === "ANNUAL" ? "/ year" : "one-time"}</strong></div>
          <div><span>Start Date</span><strong>{formatDate(policy.startDate)}</strong></div>
          <div><span>End Date</span><strong>{formatDate(policy.endDate)}</strong></div>
          <div><span>Premium Type</span><strong>{formatLabel(policy.premiumType)}</strong></div>
          <div><span>Duration</span><strong>{policy.durationYears} year{policy.durationYears > 1 ? "s" : ""}</strong></div>
        </div>
      </section>

      <div className="detail-grid">
        <Card title="Policy Snapshot">
          <dl className="detail-list">
            <div><dt>Status</dt><dd><StatusBadge status={policy.status} /></dd></div>
            <div><dt>Total Paid</dt><dd>{formatCurrency(policy.totalPremiumPaid ?? totalPaid)}</dd></div>
            <div><dt>Next Premium Due</dt><dd>{formatDate(policy.nextPremiumDueDate)}</dd></div>
            {policy.premiumType === "ANNUAL" && <div><dt>Premiums Paid</dt><dd>{policy.premiumsPaid ?? 0}/{policy.durationYears}</dd></div>}
          </dl>
        </Card>

        <Card title="Coverage Utilization">
          <dl className="detail-list">
            <div><dt>Total Coverage</dt><dd>{formatCurrency(policy.coverageAmount)}</dd></div>
            <div><dt>Claimed / Reserved</dt><dd>{formatCurrency(reservedClaimAmount)}</dd></div>
            <div><dt>Remaining Claimable</dt><dd>{formatCurrency(remainingCoverage)}</dd></div>
            <div><dt>Relevant Claims</dt><dd>{policyClaims.filter((claim) => claim.claimStatus !== "REJECTED").length}</dd></div>
          </dl>
          <p className="field-hint" style={{ marginTop: "0.75rem" }}>
            Remaining coverage excludes rejected claims. If a settlement exists, the approved settlement amount is used; otherwise the requested claim amount is reserved.
          </p>
        </Card>

        <Card title="Nominee & Address Context">
          {profile ? (
            <dl className="detail-list">
              <div><dt>Nominee</dt><dd>{profile.nomineeName}</dd></div>
              <div><dt>Relation</dt><dd>{formatLabel(profile.nomineeRelation)}</dd></div>
              <div><dt>City / State</dt><dd>{profile.city}, {profile.state}</dd></div>
              <div><dt>PIN Code</dt><dd>{profile.pinCode}</dd></div>
            </dl>
          ) : <EmptyState message="Complete your profile to show nominee and address context." />}
        </Card>
      </div>

      {policy.premiumType === "ANNUAL" && (
        <Card title="Premium Schedule">
          <div className="schedule-grid">
            {schedule.map((item) => (
              <div key={item.installment} className={`schedule-item ${item.status === "Paid" ? "paid" : ""}`}>
                <span>Installment {item.installment}</span>
                <strong>{formatDate(item.dueDate)}</strong>
                <em>{item.status}</em>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Payment History">
        {payments.length === 0 ? <EmptyState message="No payments found for this policy yet." /> : (
          <div className="table-wrap elevated-table">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{formatDateTime(payment.paymentDate)}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{formatLabel(payment.paymentMode)}</td>
                    <td>{payment.transactionReference}</td>
                    <td><StatusBadge status={payment.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}