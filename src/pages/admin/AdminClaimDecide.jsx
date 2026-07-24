import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { claimApi } from "../../api/claimApi";
import { policyApi } from "../../api/policyApi";
import { documentApi } from "../../api/documentApi";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLabel,
} from "../../utils/formatters";
import { ADMIN_DECISION_OPTIONS } from "../../utils/constants";
import {
  isBlank,
  isMeaningfulText,
  extractErrorMessage,
} from "../../utils/validators";

const MIN_REMARKS_LENGTH = 15;

export default function AdminClaimDecide() {
  const { claimId } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [finalStatus, setFinalStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const claimRes = await claimApi.getById(claimId);
      setClaim(claimRes.data.data);
      const [docsRes, historyRes, policyRes] = await Promise.all([
        documentApi.getByClaim(claimId),
        claimApi.getHistory(claimId, { page: 0, size: 50 }),
        policyApi.getById(claimRes.data.data.policyId),
      ]);
      setDocuments(docsRes.data.data);
      setHistory(historyRes.data.data.content);
      setPolicy(policyRes.data.data);
    } catch (err) {
      setError("Could not load claim details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDecisionError("");
    setRemarksError("");

    let hasError = false;
    if (isBlank(finalStatus)) {
      setDecisionError("Please select a final decision");
      hasError = true;
    }
    if (isBlank(remarks)) {
      setRemarksError("Remarks are required to justify the final decision");
      hasError = true;
    } else if (
      !isMeaningfulText(remarks, {
        minLength: MIN_REMARKS_LENGTH,
        minWords: 4,
        maxLength: 1000,
      })
    ) {
      setRemarksError(
        "Please explain your final decision with at least 4 meaningful words",
      );
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      await claimApi.decide(claimId, { finalStatus, remarks: remarks.trim() });
      setSuccess("Decision recorded.");
      loadAll();
      setFinalStatus("");
      setRemarks("");
    } catch (err) {
      setError(extractErrorMessage(err, "Could not record decision."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading claim..." />;
  if (!claim) return <EmptyState message="Claim not found." />;

  const finalized = ["APPROVED", "REJECTED"].includes(claim.claimStatus);
  const readyForDecision = [
    "RECOMMENDED_FOR_APPROVAL",
    "RECOMMENDED_FOR_REJECTION",
  ].includes(claim.claimStatus);

  return (
    <div>
      <div className="page-header">
        <button className="link-btn" onClick={() => navigate("/admin/claims")}>
          ← Back to claims
        </button>
        <h1>Claim {claim.claimNumber}</h1>
        <p className="page-subtitle">
          Filed by {claim.customerName} · Policy {claim.policyNumber}
        </p>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="detail-grid">
        <Card title="Claim Details">
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={claim.claimStatus} />
              </dd>
            </div>
            <div>
              <dt>Claim Amount</dt>
              <dd>{formatCurrency(claim.claimAmount)}</dd>
            </div>
            <div>
              <dt>Incident Date</dt>
              <dd>{formatDate(claim.incidentDate)}</dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{claim.claimReason}</dd>
            </div>
            {claim.agentRemarks && (
              <div>
                <dt>Insurance Operations Officer Remarks</dt>
                <dd>{claim.agentRemarks}</dd>
              </div>
            )}
          </dl>
        </Card>

        {policy && (
          <Card title="Policy Snapshot">
            <dl className="detail-list">
              <div>
                <dt>Policy Number</dt>
                <dd>{policy.policyNumber}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{policy.planName}</dd>
              </div>
              <div>
                <dt>Product Type</dt>
                <dd>{formatLabel(policy.productType)}</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>{formatCurrency(policy.coverageAmount)}</dd>
              </div>
              <div>
                <dt>Premium</dt>
                <dd>
                  {formatCurrency(policy.premiumAmount)}{" "}
                  {policy.premiumType === "ANNUAL" ? "/ year" : ""}
                </dd>
              </div>
              <div>
                <dt>Policy Status</dt>
                <dd>
                  <StatusBadge status={policy.status} />
                </dd>
              </div>
              <div>
                <dt>Start - End</dt>
                <dd>
                  {formatDate(policy.startDate)} → {formatDate(policy.endDate)}
                </dd>
              </div>
              <div>
                <dt>Total Paid</dt>
                <dd>{formatCurrency(policy.totalPremiumPaid)}</dd>
              </div>
              {policy.premiumType === "ANNUAL" && (
                <div>
                  <dt>Premiums Paid</dt>
                  <dd>
                    {policy.premiumsPaid ?? 0}/{policy.durationYears ?? "-"}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        <Card title="Status History">
          {history.length === 0 ? (
            <EmptyState message="No status changes yet." />
          ) : (
            <ul className="timeline">
              {history.map((h) => (
                <li key={h.historyId} className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <p className="timeline-status">
                      {formatLabel(h.previousStatus)} →{" "}
                      {formatLabel(h.newStatus)}
                    </p>
                    <p className="timeline-meta">
                      {h.updatedByName} ({h.updatedByRole}) ·{" "}
                      {formatDateTime(h.updatedAt)}
                    </p>
                    {h.remarks && (
                      <p className="timeline-remarks">"{h.remarks}"</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Supporting Documents">
        {documents.length === 0 ? (
          <EmptyState message="No documents uploaded for this claim." />
        ) : (
          <ul className="document-list">
            {documents.map((doc) => (
              <li key={doc.documentId} className="document-item">
                <a
                  href={doc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {doc.documentName}
                </a>
                <span className="document-meta">
                  {formatLabel(doc.documentType)} · {doc.fileSizeReadable}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Final Decision">
        {finalized ? (
          <p className="form-section-hint">
            A final decision has already been made on this claim:{" "}
            <StatusBadge status={claim.claimStatus} />
          </p>
        ) : !readyForDecision ? (
          <p className="form-section-hint">
            This claim hasn't been reviewed by an insurance operations officer
            yet. Current status: <StatusBadge status={claim.claimStatus} />
          </p>
        ) : (
          <form onSubmit={handleDecisionSubmit} noValidate>
            <Select
              label="Final Decision"
              value={finalStatus}
              onChange={(e) => {
                setFinalStatus(e.target.value);
                setDecisionError("");
              }}
              error={decisionError}
              options={ADMIN_DECISION_OPTIONS}
              placeholder="Choose final decision"
            />
            <div className="form-field">
              <label className="form-label">Remarks</label>
              <textarea
                className={`form-input ${remarksError ? "input-error" : ""}`}
                rows={3}
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setRemarksError("");
                }}
                placeholder="Explain your final decision..."
                maxLength={1000}
              />
              {remarksError ? (
                <span className="field-error">{remarksError}</span>
              ) : (
                <span className="field-hint">
                  {remarks.length}/1000 characters (minimum {MIN_REMARKS_LENGTH}
                  )
                </span>
              )}
            </div>
            <Button type="submit" loading={submitting}>
              Record Decision
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
