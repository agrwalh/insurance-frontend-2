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
import {
  isBlank,
  isMeaningfulText,
  isValidEmail,
  isValidMobile,
  isValidPersonName,
  passwordStrength,
} from "../../utils/validators";
import { exportToCsv } from "../../utils/exportCsv";

const emptyOfficerForm = {
  fullName: "",
  email: "",
  password: "",
  mobileNumber: "",
};

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState("");
  const [showOfficerForm, setShowOfficerForm] = useState(false);
  const [officerForm, setOfficerForm] = useState(emptyOfficerForm);
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusReasonError, setStatusReasonError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const {
    fieldErrors,
    generalError,
    setFieldError,
    clearFieldError,
    clearAll,
    handleApiError,
  } = useFormErrors();

  const {
    data,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(
    () => userApi.getAll({ page, size: 10, role: roleFilter || undefined }),
    [page, roleFilter],
  );

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(0);
  };

  const handleOfficerFormChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue =
      name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setOfficerForm((prev) => ({ ...prev, [name]: cleanedValue }));
    clearFieldError(name);
  };

  const validateOfficerForm = () => {
    const errors = {};

    if (isBlank(officerForm.fullName)) {
      errors.fullName = "Full name is required";
    } else if (!isValidPersonName(officerForm.fullName)) {
      errors.fullName = "Enter a valid full name";
    }

    if (isBlank(officerForm.email)) {
      errors.email = "Email is required";
    } else if (!isValidEmail(officerForm.email)) {
      errors.email = "Enter a valid email address";
    }

    const strength = passwordStrength(officerForm.password);
    if (!strength.valid) errors.password = strength.message;

    if (isBlank(officerForm.mobileNumber)) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!isValidMobile(officerForm.mobileNumber)) {
      errors.mobileNumber =
        "Enter a valid 10-digit Indian mobile number (starts with 6-9)";
    }

    return errors;
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    clearAll();

    const errors = validateOfficerForm();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) =>
        setFieldError(field, message),
      );
      return;
    }

    setSaving(true);
    try {
      await userApi.createAgent({
        ...officerForm,
        fullName: officerForm.fullName.trim(),
        email: officerForm.email.trim().toLowerCase(),
      });
      setSuccess("Insurance Operations Officer created successfully.");
      setShowOfficerForm(false);
      setOfficerForm(emptyOfficerForm);
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
    if (
      !isMeaningfulText(statusReason, {
        minLength: 8,
        minWords: 2,
        maxLength: 500,
      })
    ) {
      setStatusReasonError(
        "Please provide a meaningful reason with at least 2 words.",
      );
      return;
    }

    setSaving(true);
    try {
      await userApi.updateStatus(statusModalUser.userId, {
        isActive: !statusModalUser.isActive,
        reason: statusReason.trim(),
      });
      setSuccess(
        `User ${statusModalUser.isActive ? "deactivated" : "activated"}.`,
      );
      setStatusModalUser(null);
      refetch();
    } catch (err) {
      setStatusReasonError(
        err.response?.data?.message || "Could not update user status.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading users..." />;

  const users = data?.content || [];
  const activeUsers = users.filter((user) => user.isActive).length;
  const officers = users.filter((user) => user.role === "AGENT").length;

  return (
    <div className="ops-page">
      <div className="ops-hero users-hero">
        <div>
          <span className="eyebrow">Access Management</span>
          <h1>Users</h1>
          <p>
            Manage customers, officers, access status, and audit-ready account
            decisions from a clean control panel.
          </p>
        </div>
        <div className="ops-hero-panel">
          <strong>{activeUsers}</strong>
          <span>active accounts</span>
          <p>{officers} insurance operations officers visible</p>
        </div>
      </div>

      <div className="page-header ops-toolbar-header">
        <div className="page-header-row">
          <div>
            <p className="page-subtitle">
              Manage insurance operations officers and view all platform users
            </p>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <Button
              variant="secondary"
              onClick={() =>
                exportToCsv("users", data?.content || [], [
                  { header: "Name", value: (u) => u.fullName },
                  { header: "Email", value: (u) => u.email },
                  { header: "Mobile", value: (u) => u.mobileNumber },
                  { header: "Role", value: (u) => u.role },
                  {
                    header: "Active",
                    value: (u) => (u.isActive ? "Yes" : "No"),
                  },
                  { header: "Joined", value: (u) => u.createdAt },
                ])
              }
            >
              Export CSV
            </Button>
            <Button onClick={() => setShowOfficerForm(true)}>
              + New Insurance Operations Officer
            </Button>
          </div>
        </div>
      </div>

      <Alert
        type="error"
        message={generalError || fetchError}
        onClose={() => clearAll()}
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="ops-toolbar split-toolbar">
        <div className="filter-bar">
          <Select
            name="role"
            value={roleFilter}
            onChange={handleRoleFilterChange}
            options={Object.values(ROLES)}
            placeholder="All roles"
          />
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState message="No users found." />
      ) : (
        <div className="table-wrap ops-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.mobileNumber}</td>
                  <td>{formatLabel(user.role)}</td>
                  <td>
                    <span
                      className={`badge ${user.isActive ? "badge-green" : "badge-grey"}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <button
                      className="link-btn"
                      onClick={() => setViewUser(user)}
                    >
                      View
                    </button>
                    <button
                      className="link-btn"
                      onClick={() => openStatusModal(user)}
                    >
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

      {showOfficerForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowOfficerForm(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create Insurance Operations Officer</h3>
            <form onSubmit={handleCreateOfficer} noValidate>
              <Input
                label="Full Name"
                name="fullName"
                value={officerForm.fullName}
                onChange={handleOfficerFormChange}
                error={fieldErrors.fullName}
                maxLength={100}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={officerForm.email}
                onChange={handleOfficerFormChange}
                error={fieldErrors.email}
                maxLength={150}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={officerForm.password}
                onChange={handleOfficerFormChange}
                error={fieldErrors.password}
                helperText={
                  !fieldErrors.password
                    ? "At least 8 characters, with a letter and a number"
                    : undefined
                }
                placeholder="At least 8 characters"
              />
              <Input
                label="Mobile Number"
                name="mobileNumber"
                value={officerForm.mobileNumber}
                onChange={handleOfficerFormChange}
                error={fieldErrors.mobileNumber}
                inputMode="numeric"
                maxLength={10}
              />
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowOfficerForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Create Insurance Operations Officer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{viewUser.fullName}</h3>
            <p className="form-section-hint">
              Read-only account profile. Only the owner can update personal
              details.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Email</dt>
                <dd>{viewUser.email}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{viewUser.mobileNumber}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{formatLabel(viewUser.role)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{viewUser.isActive ? "Active" : "Inactive"}</dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{formatDate(viewUser.createdAt)}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setViewUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {statusModalUser && (
        <div className="modal-overlay" onClick={() => setStatusModalUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>
              {statusModalUser.isActive ? "Deactivate" : "Activate"}{" "}
              {statusModalUser.fullName}
            </h3>
            <form onSubmit={handleStatusSubmit} noValidate>
              <div className="form-field">
                <label className="form-label">Reason</label>
                <textarea
                  className={`form-input ${statusReasonError ? "input-error" : ""}`}
                  rows={3}
                  value={statusReason}
                  onChange={(e) => {
                    setStatusReason(e.target.value);
                    setStatusReasonError("");
                  }}
                  placeholder="Why are you making this change?"
                  maxLength={500}
                />
                {statusReasonError && (
                  <span className="field-error">{statusReasonError}</span>
                )}
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStatusModalUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
