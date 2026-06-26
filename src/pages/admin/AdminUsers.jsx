import { useState } from "react";
import { userApi } from "../../api/userApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatLabel, formatDate } from "../../utils/formatters";
import { ROLES } from "../../utils/constants";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isValidEmail, isValidMobile, passwordStrength } from "../../utils/validators";
import { exportToCsv } from "../../utils/exportCsv";

const emptyAgentForm = { fullName: "", email: "", password: "", mobileNumber: "" };

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm] = useState(emptyAgentForm);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusReasonError, setStatusReasonError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError } = useFormErrors();

  const { data, loading, error: fetchError, refetch } = useFetch(
    () => userApi.getAll({ page, size: 10, role: roleFilter || undefined }),
    [page, roleFilter]
  );

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(0);
  };

  const handleAgentFormChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue = name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setAgentForm((prev) => ({ ...prev, [name]: cleanedValue }));
    clearFieldError(name);
  };

  const validateAgentForm = () => {
    const errors = {};

    if (isBlank(agentForm.fullName)) {
      errors.fullName = "Full name is required";
    } else if (agentForm.fullName.trim().length < 2) {
      errors.fullName = "Name seems too short";
    }

    if (isBlank(agentForm.email)) {
      errors.email = "Email is required";
    } else if (!isValidEmail(agentForm.email)) {
      errors.email = "Enter a valid email address";
    }

    const strength = passwordStrength(agentForm.password);
    if (!strength.valid) errors.password = strength.message;

    if (isBlank(agentForm.mobileNumber)) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!isValidMobile(agentForm.mobileNumber)) {
      errors.mobileNumber = "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    return errors;
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    clearAll();

    const errors = validateAgentForm();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
      return;
    }

    setSaving(true);
    try {
      await userApi.createAgent({
        ...agentForm,
        fullName: agentForm.fullName.trim(),
        email: agentForm.email.trim().toLowerCase(),
      });
      setSuccess("Agent created successfully.");
      setShowAgentForm(false);
      setAgentForm(emptyAgentForm);
      refetch();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (user) => {
    setStatusModalUser(user);
    setStatusReason("");
    setStatusReasonError("");
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusReasonError("");

    if (isBlank(statusReason)) {
      setStatusReasonError("Please provide a reason for this status change.");
      return;
    }
    if (statusReason.trim().length < 5) {
      setStatusReasonError("Please provide a more specific reason (at least 5 characters).");
      return;
    }

    setSaving(true);
    try {
      await userApi.updateStatus(statusModalUser.userId, {
        isActive: !statusModalUser.isActive,
        reason: statusReason.trim(),
      });
      setSuccess(`User ${statusModalUser.isActive ? "deactivated" : "activated"}.`);
      setStatusModalUser(null);
      refetch();
    } catch (err) {
      setStatusReasonError(err.response?.data?.message || "Could not update user status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading users..." />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Users</h1>
            <p className="page-subtitle">Manage agents and view all platform users</p>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <Button variant="secondary" onClick={() => exportToCsv("users", data?.content || [], [
              { header: "Name", value: (u) => u.fullName },
              { header: "Email", value: (u) => u.email },
              { header: "Mobile", value: (u) => u.mobileNumber },
              { header: "Role", value: (u) => u.role },
              { header: "Active", value: (u) => u.isActive ? "Yes" : "No" },
              { header: "Joined", value: (u) => u.createdAt },
            ])}>Export CSV</Button>
            <Button onClick={() => setShowAgentForm(true)}>+ New Agent</Button>
          </div>
        </div>
      </div>

      <Alert type="error" message={generalError || fetchError} onClose={() => clearAll()} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="filter-bar">
        <Select name="role" value={roleFilter} onChange={handleRoleFilterChange} options={Object.values(ROLES)} placeholder="All roles" />
      </div>

      {data?.content?.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Mobile</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {data?.content?.map((user) => (
                <tr key={user.userId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.mobileNumber}</td>
                  <td>{formatLabel(user.role)}</td>
                  <td>
                    <span className={`badge ${user.isActive ? "badge-green" : "badge-grey"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button className="link-btn" onClick={() => setViewUser(user)}>View</button>
                    <button className="link-btn" onClick={() => openStatusModal(user)}>
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />

      {showAgentForm && (
        <div className="modal-overlay" onClick={() => setShowAgentForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create Agent</h3>
            <form onSubmit={handleCreateAgent} noValidate>
              <Input label="Full Name" name="fullName" value={agentForm.fullName} onChange={handleAgentFormChange} error={fieldErrors.fullName} maxLength={100} />
              <Input label="Email" name="email" type="email" value={agentForm.email} onChange={handleAgentFormChange} error={fieldErrors.email} maxLength={150} />
              <Input
                label="Password"
                name="password"
                type="password"
                value={agentForm.password}
                onChange={handleAgentFormChange}
                error={fieldErrors.password}
                helperText={!fieldErrors.password ? "At least 8 characters, with a letter and a number" : undefined}
                placeholder="At least 8 characters"
              />
              <Input
                label="Mobile Number"
                name="mobileNumber"
                value={agentForm.mobileNumber}
                onChange={handleAgentFormChange}
                error={fieldErrors.mobileNumber}
                inputMode="numeric"
                maxLength={10}
              />
              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setShowAgentForm(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Create Agent</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{viewUser.fullName}</h3>
            <p className="form-section-hint">Read-only account profile. Only the owner can update personal details.</p>
            <dl className="detail-list">
              <div><dt>Email</dt><dd>{viewUser.email}</dd></div>
              <div><dt>Mobile</dt><dd>{viewUser.mobileNumber}</dd></div>
              <div><dt>Role</dt><dd>{formatLabel(viewUser.role)}</dd></div>
              <div><dt>Status</dt><dd>{viewUser.isActive ? "Active" : "Inactive"}</dd></div>
              <div><dt>Joined</dt><dd>{formatDate(viewUser.createdAt)}</dd></div>
            </dl>
            <div className="modal-actions">
              <Button type="button" variant="secondary" onClick={() => setViewUser(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {statusModalUser && (
        <div className="modal-overlay" onClick={() => setStatusModalUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{statusModalUser.isActive ? "Deactivate" : "Activate"} {statusModalUser.fullName}</h3>
            <form onSubmit={handleStatusSubmit} noValidate>
              <div className="form-field">
                <label className="form-label">Reason</label>
                <textarea
                  className={`form-input ${statusReasonError ? "input-error" : ""}`}
                  rows={3}
                  value={statusReason}
                  onChange={(e) => { setStatusReason(e.target.value); setStatusReasonError(""); }}
                  placeholder="Why are you making this change?"
                  maxLength={500}
                />
                {statusReasonError && <span className="field-error">{statusReasonError}</span>}
              </div>
              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setStatusModalUser(null)}>Cancel</Button>
                <Button type="submit" loading={saving}>Confirm</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
