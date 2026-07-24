import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { policyApi } from "../../api/policyApi";
import { claimApi } from "../../api/claimApi";
import { settlementApi } from "../../api/settlementApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Card from "../../components/common/Card";
import DocumentDropzone from "../../components/common/DocumentDropzone";
import { DOCUMENT_TYPES } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { useFormErrors } from "../../hooks/useFormErrors";
import {
  isBlank,
  isPositiveAmount,
  parseStrictNumber,
  isPastOrToday,
  isMeaningfulText,
  toDateOnly,
  extractErrorMessage,
} from "../../utils/validators";

const emptyDocument = { documentName: "", documentType: "", file: null };
const MAX_DOCUMENT_ROWS = 10;

export default function FileClaim() {
  const [policies, setPolicies] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [claimSettlements, setClaimSettlements] = useState({});
  const [policiesLoading, setPoliciesLoading] = useState(true);
  const [form, setForm] = useState({ policyId: "", claimAmount: "", claimReason: "", incidentDate: "" });
  const [documents, setDocuments] = useState([{ ...emptyDocument }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError } = useFormErrors();

  useEffect(() => {
    Promise.all([
      policyApi.getMyPolicies({ page: 0, size: 100 }),
      claimApi.getMyClaims({ page: 0, size: 100 }),
    ])
      .then(([policyRes, claimRes]) => {
        const activeOnly = policyRes.data.data.content.filter((p) => p.status === "ACTIVE");
        const fetchedClaims = claimRes.data.data.content || [];
        setPolicies(activeOnly);
        setMyClaims(fetchedClaims);

        return Promise.allSettled(
          fetchedClaims
            .filter((claim) => claim.claimStatus !== "REJECTED")
            .map((claim) => settlementApi.getByClaim(claim.claimId).then((res) => [claim.claimId, res.data.data]))
        );
      })
      .then((settlementResults) => {
        if (!settlementResults) return;
        const settlementMap = {};
        settlementResults.forEach((result) => {
          if (result.status === "fulfilled") {
            const [claimId, settlement] = result.value;
            settlementMap[claimId] = settlement;
          }
        });
        setClaimSettlements(settlementMap);
      })
      .finally(() => setPoliciesLoading(false));
  }, []);

  const selectedPolicy = useMemo(
    () => policies.find((p) => String(p.policyId) === String(form.policyId)) || null,
    [policies, form.policyId]
  );

  const selectedPolicyClaimSummary = useMemo(() => {
    if (!selectedPolicy) return { reserved: 0, remaining: 0, count: 0 };
    const relevantClaims = myClaims.filter(
      (claim) => String(claim.policyId) === String(selectedPolicy.policyId) && claim.claimStatus !== "REJECTED"
    );
    const reserved = relevantClaims.reduce((sum, claim) => {
      const settlement = claimSettlements[claim.claimId];
      return sum + Number(settlement?.approvedAmount ?? claim.claimAmount ?? 0);
    }, 0);
    const remaining = Math.max(0, Number(selectedPolicy.coverageAmount || 0) - reserved);
    return { reserved, remaining, count: relevantClaims.length };
  }, [claimSettlements, myClaims, selectedPolicy]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    if (name === "policyId") clearFieldError("claimAmount");
  };

  const handleDocumentChange = (index, field, value) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    clearFieldError("documents");
  };

  const addDocumentRow = () => {
    if (documents.length >= MAX_DOCUMENT_ROWS) return;
    setDocuments((prev) => [...prev, { ...emptyDocument }]);
  };

  const removeDocumentRow = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const clearDocumentRow = (index) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[index] = { ...emptyDocument };
      return next;
    });
    clearFieldError("documents");
  };

  const validate = () => {
    const errors = {};

    if (isBlank(form.policyId)) errors.policyId = "Please select a policy";

    if (isBlank(form.claimAmount)) {
      errors.claimAmount = "Claim amount is required";
    } else if (!isPositiveAmount(form.claimAmount)) {
      errors.claimAmount = "Enter a valid amount greater than 0";
    } else if (selectedPolicy) {
      const amount = parseStrictNumber(form.claimAmount);
      const coverage = Number(selectedPolicy.coverageAmount);
      const remaining = selectedPolicyClaimSummary.remaining;
      if (amount > coverage) {
        errors.claimAmount = `Claim amount cannot exceed this policy's coverage of ${formatCurrency(coverage)}`;
      } else if (amount > remaining) {
        errors.claimAmount = `Claim amount cannot exceed remaining claimable coverage of ${formatCurrency(remaining)}`;
      }
    }

    if (isBlank(form.incidentDate)) {
      errors.incidentDate = "Incident date is required";
    } else if (!isPastOrToday(form.incidentDate)) {
      errors.incidentDate = "Incident date cannot be in the future";
    } else if (selectedPolicy?.startDate) {
      const incident = toDateOnly(form.incidentDate);
      const policyStart = toDateOnly(selectedPolicy.startDate);
      if (policyStart && incident.getTime() < policyStart.getTime()) {
        errors.incidentDate = `Incident date cannot be before the policy's start date (${formatDate(selectedPolicy.startDate)})`;
      }
    }

    if (isBlank(form.claimReason)) {
      errors.claimReason = "Please describe what happened";
    } else if (!isMeaningfulText(form.claimReason, { minLength: 20, minWords: 5, maxLength: 2000 })) {
      errors.claimReason = "Please describe the incident clearly with at least 5 meaningful words";
    }

    const activeDocuments = documents.filter((d) => d.documentName || d.documentType || d.file);

    if (activeDocuments.length === 0) {
      errors.documents = "Please attach at least one supporting document";
    } else {
      const incomplete = activeDocuments.some((d) => isBlank(d.documentName) || isBlank(d.documentType) || !d.file);
      if (incomplete) {
        errors.documents = "Each document row needs a name, type, and an attached file - remove any unfinished rows";
      } else if (activeDocuments.some((d) => !isMeaningfulText(d.documentName, { minLength: 3, minWords: 1, maxLength: 150 }))) {
        errors.documents = "Document names must be meaningful (at least 3 characters)";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAll();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
      return;
    }

    const activeDocuments = documents.filter((d) => d.documentName && d.documentType && d.file);

    const formData = new FormData();
    formData.append(
      "claimData",
      new Blob(
        [
          JSON.stringify({
            policyId: Number(form.policyId),
            claimAmount: parseStrictNumber(form.claimAmount),
            claimReason: form.claimReason.trim(),
            incidentDate: form.incidentDate,
          }),
        ],
        { type: "application/json" }
      )
    );
    activeDocuments.forEach((doc) => {
      formData.append("files", doc.file);
      formData.append("documentNames", doc.documentName.trim());
      formData.append("documentTypes", doc.documentType);
    });

    setLoading(true);
    try {
      const res = await claimApi.submitWithDocuments(formData);
      const newClaimId = res.data.data.claimId;
      navigate(`/customer/claims/${newClaimId}`, { state: { justSubmitted: true } });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>File a Claim</h1>
        <p className="page-subtitle">Tell us what happened and attach your supporting documents — all in one go</p>
      </div>

      <Card>
        <Alert type="error" message={generalError} onClose={() => clearAll()} />

        {!policiesLoading && policies.length === 0 && (
          <Alert type="error" message="You don't have any active policies. A claim can only be filed against an active policy." />
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Select
            label="Policy"
            name="policyId"
            value={form.policyId}
            onChange={handleFormChange}
            error={fieldErrors.policyId}
            placeholder="Select an active policy"
            options={policies.map((p) => ({ value: p.policyId, label: `${p.policyNumber} — ${p.planName}` }))}
            disabled={policiesLoading || policies.length === 0}
          />

          <div className="form-row">
            <Input
              label="Claim Amount"
              name="claimAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.claimAmount}
              onChange={handleFormChange}
              error={fieldErrors.claimAmount}
              helperText={selectedPolicy ? `Remaining claimable: ${formatCurrency(selectedPolicyClaimSummary.remaining)} · Reserved in existing claims: ${formatCurrency(selectedPolicyClaimSummary.reserved)}` : "Select a policy first"}
              placeholder="50000"
              disabled={!selectedPolicy}
            />
            <Input
              label="Incident Date"
              name="incidentDate"
              type="date"
              value={form.incidentDate}
              onChange={handleFormChange}
              error={fieldErrors.incidentDate}
              helperText={selectedPolicy?.startDate ? `Policy active since ${formatDate(selectedPolicy.startDate)}` : undefined}
              min={selectedPolicy?.startDate || undefined}
              max={new Date().toISOString().split("T")[0]}
              disabled={!selectedPolicy}
            />
          </div>

          {selectedPolicy && (
            <div className="safety-warning-card">
              <strong>Coverage remaining for this policy</strong>
              <p>
                Total coverage is {formatCurrency(selectedPolicy.coverageAmount)}. Existing non-rejected claims reserve {formatCurrency(selectedPolicyClaimSummary.reserved)}, so you can currently claim up to {formatCurrency(selectedPolicyClaimSummary.remaining)}.
              </p>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Claim Reason</label>
            <textarea
              className={`form-input ${fieldErrors.claimReason ? "input-error" : ""}`}
              name="claimReason"
              rows={4}
              value={form.claimReason}
              onChange={handleFormChange}
              placeholder="Describe what happened in detail (at least 20 characters)..."
              maxLength={2000}
            />
            {fieldErrors.claimReason ? (
              <span className="field-error">{fieldErrors.claimReason}</span>
            ) : (
              <span className="field-hint">{form.claimReason.length}/2000 characters</span>
            )}
          </div>

          <hr className="form-divider" />
          <h3 className="form-section-title">Supporting Documents</h3>
          <p className="form-section-hint">
            Attach the actual files (hospital bill, invoice, photo, etc.) that support this claim — PDF, JPG, or PNG.
          </p>
          {fieldErrors.documents && <Alert type="error" message={fieldErrors.documents} onClose={() => clearFieldError("documents")} />}

          {documents.map((doc, index) => (
            <div key={index} className="document-row-full">
              <div className="form-row">
                <Input
                  label="Document Name"
                  value={doc.documentName}
                  onChange={(e) => handleDocumentChange(index, "documentName", e.target.value)}
                  placeholder="e.g. Hospital Bill"
                  maxLength={150}
                />
                <Select
                  label="Document Type"
                  value={doc.documentType}
                  onChange={(e) => handleDocumentChange(index, "documentType", e.target.value)}
                  options={DOCUMENT_TYPES}
                  placeholder="Select type"
                />
              </div>

              <DocumentDropzone onFileSelected={(file) => handleDocumentChange(index, "file", file)} />

              {documents.length > 1 && (
                <button type="button" className="link-btn link-btn-danger" onClick={() => removeDocumentRow(index)}>
                  Remove this document
                </button>
              )}
              {documents.length === 1 && (doc.documentName || doc.documentType || doc.file) && (
                <button type="button" className="link-btn" onClick={() => clearDocumentRow(index)}>
                  Clear
                </button>
              )}
              <hr className="form-divider" />
            </div>
          ))}

          {documents.length < MAX_DOCUMENT_ROWS ? (
            <button type="button" className="link-btn" onClick={addDocumentRow}>
              + Add another document
            </button>
          ) : (
            <span className="field-hint">Maximum of {MAX_DOCUMENT_ROWS} documents per claim</span>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Button type="submit" loading={loading} disabled={policies.length === 0}>
              Submit Claim
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}