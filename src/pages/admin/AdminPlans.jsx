import { useState, useEffect } from "react";
import { planApi } from "../../api/planApi";
import { productApi } from "../../api/productApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatCurrency, formatLabel } from "../../utils/formatters";
import { PREMIUM_TYPES } from "../../utils/constants";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isPositiveAmount, parseStrictNumber } from "../../utils/validators";
import { exportToCsv } from "../../utils/exportCsv";

const emptyForm = {
  productId: "", planName: "", coverageAmount: "", premiumAmount: "", premiumType: "", durationYears: "", termsAndConditions: "",
};

const MAX_DURATION_YEARS = 50;

export default function AdminPlans() {
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError } = useFormErrors();

  const { data, loading, error: fetchError, refetch } = useFetch(() => planApi.getActive({ page, size: 10 }), [page]);

  useEffect(() => {
    productApi.getActive({ page: 0, size: 100 }).then((res) => setProducts(res.data.data.content));
  }, []);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    clearAll();
  };

  const openEditForm = (plan) => {
    setForm({
      productId: plan.productId,
      planName: plan.planName,
      coverageAmount: plan.coverageAmount,
      premiumAmount: plan.premiumAmount,
      premiumType: plan.premiumType,
      durationYears: plan.durationYears,
      termsAndConditions: plan.termsAndConditions,
    });
    setEditingId(plan.planId);
    setShowForm(true);
    clearAll();
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearFieldError(e.target.name);
  };

  const validate = () => {
    const errors = {};

    if (isBlank(form.productId)) errors.productId = "Please select a product";

    if (isBlank(form.planName)) {
      errors.planName = "Plan name is required";
    } else if (form.planName.trim().length < 3) {
      errors.planName = "Name must be at least 3 characters";
    }

    if (isBlank(form.coverageAmount)) {
      errors.coverageAmount = "Coverage amount is required";
    } else if (!isPositiveAmount(form.coverageAmount)) {
      errors.coverageAmount = "Enter a valid amount greater than 0";
    }

    if (isBlank(form.premiumAmount)) {
      errors.premiumAmount = "Premium amount is required";
    } else if (!isPositiveAmount(form.premiumAmount)) {
      errors.premiumAmount = "Enter a valid amount greater than 0";
    }


    if (isPositiveAmount(form.coverageAmount) && isPositiveAmount(form.premiumAmount)) {
      const coverage = parseStrictNumber(form.coverageAmount);
      const premium = parseStrictNumber(form.premiumAmount);
      if (premium >= coverage) {
        errors.premiumAmount = "Premium should be less than the coverage amount";
      }
    }

    if (isBlank(form.premiumType)) errors.premiumType = "Premium type is required";

    if (isBlank(form.durationYears)) {
      errors.durationYears = "Duration is required";
    } else {
      const duration = parseStrictNumber(form.durationYears);
      if (duration === null || !Number.isInteger(duration) || duration < 1) {
        errors.durationYears = "Duration must be a whole number of at least 1 year";
      } else if (duration > MAX_DURATION_YEARS) {
        errors.durationYears = `Duration seems unrealistic (max ${MAX_DURATION_YEARS} years)`;
      }
    }

    if (isBlank(form.termsAndConditions)) {
      errors.termsAndConditions = "Terms and conditions are required";
    } else if (form.termsAndConditions.trim().length < 10) {
      errors.termsAndConditions = "Please provide more detail (at least 10 characters)";
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

    setSaving(true);
    try {
      const payload = {
        ...form,
        planName: form.planName.trim(),
        termsAndConditions: form.termsAndConditions.trim(),
        productId: Number(form.productId),
        coverageAmount: parseStrictNumber(form.coverageAmount),
        premiumAmount: parseStrictNumber(form.premiumAmount),
        durationYears: parseStrictNumber(form.durationYears),
      };

      if (editingId) {
        await planApi.update(editingId, payload);
        setSuccess("Plan updated.");
      } else {
        await planApi.create(payload);
        setSuccess("Plan created.");
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (planId) => {
    if (!window.confirm("Deactivate this plan? Customers will no longer be able to purchase it.")) return;
    try {
      await planApi.deactivate(planId);
      setSuccess("Plan deactivated.");
      refetch();
    } catch (err) {
      handleApiError(err);
    }
  };

  if (loading) return <Loader label="Loading plans..." />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Plans</h1>
            <p className="page-subtitle">Manage plans offered under each product</p>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <Button variant="secondary" onClick={() => exportToCsv("plans", data?.content || [], [
              { header: "Plan", value: (p) => p.planName },
              { header: "Product", value: (p) => p.productName },
              { header: "Coverage", value: (p) => p.coverageAmount },
              { header: "Premium", value: (p) => p.premiumAmount },
              { header: "Premium Type", value: (p) => p.premiumType },
              { header: "Duration", value: (p) => p.durationYears },
            ])}>Export CSV</Button>
            <Button onClick={openCreateForm}>+ New Plan</Button>
          </div>
        </div>
      </div>

      <Alert type="error" message={generalError || fetchError} onClose={() => clearAll()} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      {data?.content?.length === 0 ? (
        <EmptyState message="No plans yet. Create your first one." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Plan</th><th>Product</th><th>Coverage</th><th>Premium</th><th>Duration</th><th></th></tr>
            </thead>
            <tbody>
              {data?.content?.map((plan) => (
                <tr key={plan.planId}>
                  <td>{plan.planName}</td>
                  <td>{plan.productName}</td>
                  <td>{formatCurrency(plan.coverageAmount)}</td>
                  <td>{formatCurrency(plan.premiumAmount)} ({formatLabel(plan.premiumType)})</td>
                  <td>{plan.durationYears} yr</td>
                  <td className="action-cell">
                    <button className="link-btn" onClick={() => openEditForm(plan)}>Edit</button>
                    <button className="link-btn link-btn-danger" onClick={() => handleDeactivate(plan.planId)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pageData={data} onPageChange={setPage} />

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "Edit Plan" : "New Plan"}</h3>
            <form onSubmit={handleSubmit} noValidate>
              <Select
                label="Product"
                name="productId"
                value={form.productId}
                onChange={handleChange}
                error={fieldErrors.productId}
                options={products.map((p) => ({ value: p.productId, label: p.productName }))}
                placeholder="Select product"
              />
              <Input
                label="Plan Name"
                name="planName"
                value={form.planName}
                onChange={handleChange}
                error={fieldErrors.planName}
                placeholder="e.g. Family Floater Gold"
                maxLength={150}
              />
              <div className="form-row">
                <Input
                  label="Coverage Amount"
                  name="coverageAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.coverageAmount}
                  onChange={handleChange}
                  error={fieldErrors.coverageAmount}
                  placeholder="500000"
                />
                <Input
                  label="Premium Amount"
                  name="premiumAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.premiumAmount}
                  onChange={handleChange}
                  error={fieldErrors.premiumAmount}
                  placeholder="12000"
                />
              </div>
              <div className="form-row">
                <Select
                  label="Premium Type"
                  name="premiumType"
                  value={form.premiumType}
                  onChange={handleChange}
                  error={fieldErrors.premiumType}
                  options={PREMIUM_TYPES}
                  placeholder="Select type"
                />
                <Input
                  label="Duration (years)"
                  name="durationYears"
                  type="number"
                  min="1"
                  max={MAX_DURATION_YEARS}
                  step="1"
                  value={form.durationYears}
                  onChange={handleChange}
                  error={fieldErrors.durationYears}
                  placeholder="1"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Terms and Conditions</label>
                <textarea
                  className={`form-input ${fieldErrors.termsAndConditions ? "input-error" : ""}`}
                  name="termsAndConditions"
                  rows={3}
                  value={form.termsAndConditions}
                  onChange={handleChange}
                  placeholder="Key terms customers should know..."
                  maxLength={2000}
                />
                {fieldErrors.termsAndConditions && <span className="field-error">{fieldErrors.termsAndConditions}</span>}
              </div>
              <div className="modal-actions">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>{editingId ? "Save Changes" : "Create Plan"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
