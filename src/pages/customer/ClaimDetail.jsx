import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { claimApi } from "../../api/claimApi";
import { documentApi } from "../../api/documentApi";
import { settlementApi } from "../../api/settlementApi";
import DocumentDropzone from "../../components/common/DocumentDropzone";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, formatDate, formatDateTime, formatLabel } from "../../utils/formatters";
import { DOCUMENT_TYPES } from "../../utils/constants";
import { isBlank, extractErrorMessage } from "../../utils/validators";

const MAX_DOCUMENTS_PER_CLAIM = 15;

export default function ClaimDetail() {
  const { claimId } = useParams();
  const location = useLocation();

  const [claim, setClaim] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.justSubmitted ? "Claim submitted! Now upload your supporting documents below." : ""
  );

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadAll();
  }, [claimId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [claimRes, docsRes, historyRes, settlementRes] = await Promise.allSettled([
        claimApi.getById(claimId),
        documentApi.getByClaim(claimId),
        claimApi.getHistory(claimId, { page: 0, size: 50 }),
        settlementApi.getByClaim(claimId),
      ]);

      if (claimRes.status !== "fulfilled") throw claimRes.reason;
      setClaim(claimRes.value.data.data);
      setDocuments(docsRes.status === "fulfilled" ? docsRes.value.data.data : []);
      setHistory(historyRes.status === "fulfilled" ? historyRes.value.data.data.content : []);
      setSettlement(settlementRes.status === "fulfilled" ? settlementRes.value.data.data : null);
    } catch (err) {
      setError("Could not load claim details.");
    } finally {
      setLoading(false);
    }
  };

  const validateUpload = () => {
    const errors = {};
    if (isBlank(docName)) {
      errors.docName = "Document name is required";
    } else if (docName.trim().length < 3) {
      errors.docName = "Name must be at least 3 characters";
    } else if (docName.trim().length > 150) {
      errors.docName = "Name is too long (max 150 characters)";
    }

    if (isBlank(docType)) {
      errors.docType = "Please select a document type";
    }

    if (!selectedFile) {
      errors.file = "Please select a file to upload";
    }

    if (documents.length >= MAX_DOCUMENTS_PER_CLAIM) {
      errors.file = `This claim already has the maximum of ${MAX_DOCUMENTS_PER_CLAIM} documents`;
    }

    return errors;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateUpload();
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      return;
    }
    setUploadErrors({});

    setUploading(true);
    try {
      await documentApi.upload(claimId, docName.trim(), docType, selectedFile);
      setSuccess("Document uploaded successfully.");
      setDocName("");
      setDocType("");
      setSelectedFile(null);
      const docsRes = await documentApi.getByClaim(claimId);
      setDocuments(docsRes.data.data);
    } catch (err) {
      setError(extractErrorMessage(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, documentName) => {
    if (!documentId) {
      setError("Could not identify this document for deletion. Please refresh and try again.");
      return;
    }
    if (!window.confirm(`Delete "${documentName}"? This cannot be undone.`)) return;

    setError("");
    setDeletingId(documentId);
    try {
      await documentApi.delete(documentId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== documentId));
    } catch (err) {
      setError(extractErrorMessage(err, "Could not delete document."));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loader label="Loading claim..." />;
  if (!claim) return <EmptyState message="Claim not found." />;

  const canManageDocuments = claim.claimStatus === "SUBMITTED" || claim.claimStatus === "UNDER_REVIEW";

  return (
    <div>
      <div className="page-header">
        <h1>Claim {claim.claimNumber}</h1>
        <p className="page-subtitle">Policy: {claim.policyNumber}</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="detail-grid">
        <Card title="Claim Details">
          <dl className="detail-list">
            <div><dt>Status</dt><dd><StatusBadge status={claim.claimStatus} /></dd></div>
            <div><dt>Claim Amount</dt><dd>{formatCurrency(claim.claimAmount)}</dd></div>
            <div><dt>Incident Date</dt><dd>{formatDate(claim.incidentDate)}</dd></div>
            <div><dt>Reason</dt><dd>{claim.claimReason}</dd></div>
            {claim.agentRemarks && <div><dt>Insurance Operations Officer Remarks</dt><dd>{claim.agentRemarks}</dd></div>}
            {claim.adminRemarks && <div><dt>Admin Remarks</dt><dd>{claim.adminRemarks}</dd></div>}
            <div><dt>Submitted</dt><dd>{formatDateTime(claim.createdAt)}</dd></div>
          </dl>
        </Card>

        <Card title="Settlement Details">
          {settlement ? (
            <dl className="detail-list">
              <div><dt>Settlement Number</dt><dd>{settlement.settlementNumber || "—"}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={settlement.settlementStatus} /></dd></div>
              <div><dt>Approved Amount</dt><dd>{formatCurrency(settlement.approvedAmount)}</dd></div>
              <div><dt>Payment Reference</dt><dd>{settlement.paymentReference || "Pending"}</dd></div>
              <div><dt>Initiated</dt><dd>{formatDateTime(settlement.createdAt || settlement.initiatedAt)}</dd></div>
              <div><dt>Paid / Updated</dt><dd>{formatDateTime(settlement.paidAt || settlement.updatedAt)}</dd></div>
            </dl>
          ) : claim.claimStatus === "APPROVED" ? (
            <div className="settlement-empty-card">
              <strong>Approved — settlement pending</strong>
              <p>Your claim is approved. Settlement details will appear here once admin initiates payout.</p>
            </div>
          ) : claim.claimStatus === "REJECTED" ? (
            <div className="settlement-empty-card rejected">
              <strong>No settlement applicable</strong>
              <p>This claim was rejected, so no settlement payout will be generated.</p>
            </div>
          ) : (
            <div className="settlement-empty-card">
              <strong>Settlement not available yet</strong>
              <p>Settlement details become available after claim approval and payout initiation.</p>
            </div>
          )}
        </Card>

        <Card title="Status History">
          {history.length === 0 ? (
            <EmptyState message="No status changes yet." />
          ) : (
            <ul className="timeline">
              {history.map((h) => (
                <li key={h.historyId} className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <p className="timeline-status">{formatLabel(h.previousStatus)} → {formatLabel(h.newStatus)}</p>
                    <p className="timeline-meta">{h.updatedByName} ({h.updatedByRole}) · {formatDateTime(h.updatedAt)}</p>
                    {h.remarks && <p className="timeline-remarks">"{h.remarks}"</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Supporting Documents">
        {documents.length === 0 ? (
          <EmptyState message="No documents uploaded yet." />
        ) : (
          <ul className="document-list">
            {documents.map((doc) => {
              const docId = doc.documentId || doc.id;
              return (
              <li key={docId || doc.documentUrl || doc.documentName} className="document-item">
                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">{doc.documentName}</a>
                <span className="document-meta">{formatLabel(doc.documentType)} · {doc.fileSizeReadable}</span>
                {canManageDocuments && (
                  <button
                    type="button"
                    className="link-btn link-btn-danger"
                    disabled={deletingId === docId}
                    onClick={() => handleDeleteDocument(docId, doc.documentName)}
                  >
                    {deletingId === docId ? "Deleting..." : "Delete"}
                  </button>
                )}
              </li>
            );
            })}
          </ul>
        )}

        {canManageDocuments ? (
          <>
            <hr className="form-divider" />
            <h4 className="form-section-title">Upload Supporting File</h4>
            <p className="form-section-hint">
              Upload the actual file for your bill, report, photo, or other proof. You can remove uploaded files while the claim is still submitted or under review.
            </p>

            <form onSubmit={handleUpload} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Document Name</label>
                  <input
                    className={`form-input ${uploadErrors.docName ? "input-error" : ""}`}
                    value={docName}
                    onChange={(e) => { setDocName(e.target.value); setUploadErrors((p) => ({ ...p, docName: "" })); }}
                    placeholder="e.g. Hospital Bill"
                    maxLength={150}
                  />
                  {uploadErrors.docName && <span className="field-error">{uploadErrors.docName}</span>}
                </div>
                <Select
                  label="Document Type"
                  value={docType}
                  onChange={(e) => { setDocType(e.target.value); setUploadErrors((p) => ({ ...p, docType: "" })); }}
                  error={uploadErrors.docType}
                  options={DOCUMENT_TYPES}
                  placeholder="Select type"
                />
              </div>

              <DocumentDropzone onFileSelected={(f) => { setSelectedFile(f); setUploadErrors((p) => ({ ...p, file: "" })); }} />
              {uploadErrors.file && <span className="field-error">{uploadErrors.file}</span>}

              <div style={{ marginTop: "1rem" }}>
                <Button type="submit" loading={uploading} disabled={documents.length >= MAX_DOCUMENTS_PER_CLAIM}>
                  Upload Document
                </Button>
              </div>
            </form>
          </>
        ) : (
          <p className="form-section-hint" style={{ marginTop: "1rem" }}>
            This claim has already been reviewed, so new documents can no longer be added.
          </p>
        )}
      </Card>
    </div>
  );
}
