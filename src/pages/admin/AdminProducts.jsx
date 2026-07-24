import { useState } from "react";
import { productApi } from "../../api/productApi";
import { useFetch } from "../../hooks/useFetch";
import Loader from "../../components/common/Loader";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { formatLabel } from "../../utils/formatters";
import { PRODUCT_TYPES } from "../../utils/constants";
import { useFormErrors } from "../../hooks/useFormErrors";
import {
  isBlank,
  isMeaningfulText,
  isValidPlanOrProductName,
} from "../../utils/validators";
import { exportToCsv } from "../../utils/exportCsv";

const emptyForm = {
  productName: "",
  productType: "",
  description: "",
  isActive: true,
};

export default function AdminProducts() {
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
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
  } = useFetch(() => productApi.getAll({ page, size: 10 }), [page]);

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    clearAll();
  };

  const openEditForm = (product) => {
    setForm({
      productName: product.productName,
      productType: product.productType,
      description: product.description,
      isActive: product.isActive,
    });
    setEditingId(product.productId);
    setShowForm(true);
    clearAll();
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearFieldError(e.target.name);
  };

  const validate = () => {
    const errors = {};
    if (isBlank(form.productName)) {
      errors.productName = "Product name is required";
    } else if (!isValidPlanOrProductName(form.productName)) {
      errors.productName =
        "Use 3-150 valid letters/numbers and basic punctuation";
    } else if (form.productName.trim().length > 150) {
      errors.productName = "Name is too long (max 150 characters)";
    }

    if (isBlank(form.productType)) {
      errors.productType = "Product type is required";
    }

    if (isBlank(form.description)) {
      errors.description = "Description is required";
    } else if (
      !isMeaningfulText(form.description, {
        minLength: 10,
        minWords: 3,
        maxLength: 1000,
      })
    ) {
      errors.description =
        "Description must be meaningful, 10-1000 characters, and at least 3 words";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAll();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) =>
        setFieldError(field, message),
      );
      return;
    }

    const payload = {
      ...form,
      productName: form.productName.trim(),
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await productApi.update(editingId, payload);
        setSuccess("Product updated.");
      } else {
        await productApi.create(payload);
        setSuccess("Product created.");
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (productId) => {
    if (
      !window.confirm(
        "Deactivate this product? Customers will no longer be able to purchase plans under it.",
      )
    ) {
      return;
    }
    try {
      await productApi.deactivate(productId);
      setSuccess("Product deactivated.");
      refetch();
    } catch (err) {
      handleApiError(err);
    }
  };

  if (loading) return <Loader label="Loading products..." />;

  const products = data?.content || [];

  return (
    <div className="catalog-page">
      <div className="catalog-hero compact-admin-hero">
        <div>
          <span className="eyebrow">Catalog Control</span>
          <h1>Products</h1>
          <p>
            Keep insurance categories clean, descriptive, and ready for
            customer-facing discovery.
          </p>
        </div>
        <div className="catalog-summary-grid">
          <div>
            <strong>{products.length}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{products.filter((p) => p.isActive).length}</strong>
            <span>Active</span>
          </div>
        </div>
      </div>

      <div className="page-header catalog-toolbar">
        <div className="page-header-row">
          <div>
            <p className="page-subtitle">Manage insurance product categories</p>
          </div>
          <div className="modal-actions" style={{ marginTop: 0 }}>
            <Button
              variant="secondary"
              onClick={() =>
                exportToCsv("products", data?.content || [], [
                  { header: "Name", value: (p) => p.productName },
                  { header: "Type", value: (p) => p.productType },
                  { header: "Description", value: (p) => p.description },
                  {
                    header: "Active",
                    value: (p) => (p.isActive ? "Yes" : "No"),
                  },
                ])
              }
            >
              Export CSV
            </Button>
            <Button onClick={openCreateForm}>+ New Product</Button>
          </div>
        </div>
      </div>

      <Alert
        type="error"
        message={generalError || fetchError}
        onClose={() => clearAll()}
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      {products.length === 0 ? (
        <EmptyState message="No products yet. Create your first one." />
      ) : (
        <div className="table-wrap catalog-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.productId}>
                  <td>{product.productName}</td>
                  <td>{formatLabel(product.productType)}</td>
                  <td className="truncate-cell">{product.description}</td>
                  <td>
                    <span
                      className={`badge ${product.isActive ? "badge-green" : "badge-grey"}`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="action-cell">
                    <button
                      className="link-btn"
                      onClick={() => openEditForm(product)}
                    >
                      Edit
                    </button>
                    {product.isActive && (
                      <button
                        className="link-btn link-btn-danger"
                        onClick={() => handleDeactivate(product.productId)}
                      >
                        Deactivate
                      </button>
                    )}
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
            <h3>{editingId ? "Edit Product" : "New Product"}</h3>
            <form onSubmit={handleSubmit} noValidate>
              <Input
                label="Product Name"
                name="productName"
                value={form.productName}
                onChange={handleChange}
                error={fieldErrors.productName}
                placeholder="e.g. HealthSecure Plus"
                maxLength={150}
              />
              <Select
                label="Product Type"
                name="productType"
                value={form.productType}
                onChange={handleChange}
                error={fieldErrors.productType}
                options={PRODUCT_TYPES}
                placeholder="Select type"
              />
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                  className={`form-input ${fieldErrors.description ? "input-error" : ""}`}
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="At least 10 characters"
                  maxLength={1000}
                />
                {fieldErrors.description ? (
                  <span className="field-error">{fieldErrors.description}</span>
                ) : (
                  <span className="field-hint">
                    {form.description.length}/1000 characters
                  </span>
                )}
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
