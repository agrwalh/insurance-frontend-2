import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { claimApi } from "../../api/claimApi";
import { documentApi } from "../../api/documentApi";
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
      const [claimRes, docsRes, historyRes] = await Promise.all([
        claimApi.getById(claimId),
        documentApi.getByClaim(claimId),
        claimApi.getHistory(claimId, { page: 0, size: 50 }),
      ]);
      setClaim(claimRes.data.data);
      setDocuments(docsRes.data.data);
      setHistory(historyRes.data.data.content);
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
            {claim.agentRemarks && <div><dt>Agent Remarks</dt><dd>{claim.agentRemarks}</dd></div>}
            {claim.adminRemarks && <div><dt>Admin Remarks</dt><dd>{claim.adminRemarks}</dd></div>}
            <div><dt>Submitted</dt><dd>{formatDateTime(claim.createdAt)}</dd></div>
          </dl>
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
            {documents.map((doc) => (
              <li key={doc.documentId} className="document-item">
                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">{doc.documentName}</a>
                <span className="document-meta">{formatLabel(doc.documentType)} · {doc.fileSizeReadable}</span>
                {canManageDocuments && (
                  <button
                    className="link-btn link-btn-danger"
                    disabled={deletingId === doc.documentId}
                    onClick={() => handleDeleteDocument(doc.documentId, doc.documentName)}
                  >
                    {deletingId === doc.documentId ? "Deleting..." : "Delete"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManageDocuments ? (
          <>
            <hr className="form-divider" />
            <h4 className="form-section-title">Upload New Document</h4>

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
