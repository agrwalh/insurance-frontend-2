import { useState, useEffect } from "react";
import { customerApi } from "../../api/customerApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import { useFormErrors } from "../../hooks/useFormErrors";
import { INDIAN_STATES, NOMINEE_RELATIONS } from "../../utils/constants";
import { formatLabel } from "../../utils/formatters";
import {
  isBlank,
  isValidPinCode,
  isAtLeast18YearsOld,
  isRealisticDob,
  isPastOrToday,
  isValidCityOrState,
  isValidPersonName,
  isMeaningfulText,
} from "../../utils/validators";

const emptyForm = {
  dateOfBirth: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  nomineeName: "",
  nomineeRelation: "",
};

const TODAY = new Date().toISOString().split("T")[0];

export default function CustomerProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const {
    fieldErrors,
    generalError,
    setFieldError,
    clearFieldError,
    clearAll,
    handleApiError,
    setGeneralError,
  } = useFormErrors();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getMyProfile();
      const profile = res.data.data;
      setForm({
        dateOfBirth: profile.dateOfBirth || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        pinCode: profile.pinCode || "",
        nomineeName: profile.nomineeName || "",
        nomineeRelation: profile.nomineeRelation || "",
      });
      setHasProfile(true);
    } catch (err) {
      if (err.response?.status !== 404) {
        setGeneralError("Could not load your profile.");
      }
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue =
      name === "pinCode" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setForm((prev) => ({ ...prev, [name]: cleanedValue }));
    clearFieldError(name);
  };

  const validate = () => {
    const errors = {};

    if (isBlank(form.dateOfBirth)) {
      errors.dateOfBirth = "Date of birth is required";
    } else if (!isPastOrToday(form.dateOfBirth)) {
      errors.dateOfBirth = "Date of birth cannot be in the future";
    } else if (!isRealisticDob(form.dateOfBirth)) {
      errors.dateOfBirth = "Please enter a realistic date of birth";
    } else if (!isAtLeast18YearsOld(form.dateOfBirth)) {
      errors.dateOfBirth = "You must be at least 18 years old";
    }

    if (isBlank(form.address)) {
      errors.address = "Address is required";
    } else if (
      !isMeaningfulText(form.address, {
        minLength: 8,
        minWords: 2,
        maxLength: 250,
      })
    ) {
      errors.address = "Enter a complete address with meaningful words";
    }

    if (isBlank(form.city)) errors.city = "City is required";
    else if (!isValidCityOrState(form.city))
      errors.city = "Enter a valid city name";
    if (isBlank(form.state)) errors.state = "State is required";
    else if (!isValidCityOrState(form.state))
      errors.state = "Enter a valid state name";

    if (isBlank(form.pinCode)) {
      errors.pinCode = "PIN code is required";
    } else if (!isValidPinCode(form.pinCode)) {
      errors.pinCode = "Enter a valid 6-digit PIN code";
    }

    if (isBlank(form.nomineeName)) {
      errors.nomineeName = "Nominee name is required";
    } else if (!isValidPersonName(form.nomineeName)) {
      errors.nomineeName = "Enter a valid nominee name";
    }

    if (isBlank(form.nomineeRelation))
      errors.nomineeRelation = "Nominee relation is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAll();
    setSuccess("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) =>
        setFieldError(field, message),
      );
      return;
    }

    const payload = {
      ...form,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      nomineeName: form.nomineeName.trim(),
      nomineeRelation: form.nomineeRelation.trim(),
    };

    setSaving(true);
    try {
      if (hasProfile) {
        await customerApi.updateProfile(payload);
        setSuccess("Profile updated successfully.");
      } else {
        await customerApi.createProfile(payload);
        setSuccess("Profile created successfully.");
        setHasProfile(true);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading your profile..." />;

  const completedFields = Object.values(form).filter(
    (value) => !isBlank(value),
  ).length;
  const completion = Math.round(
    (completedFields / Object.keys(emptyForm).length) * 100,
  );
  const age = form.dateOfBirth
    ? Math.max(
        0,
        new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear(),
      )
    : null;
  const readinessItems = [
    {
      label: "Personal age verification",
      done: !isBlank(form.dateOfBirth) && !fieldErrors.dateOfBirth,
    },
    {
      label: "Serviceable address",
      done:
        !isBlank(form.address) &&
        !isBlank(form.city) &&
        !isBlank(form.state) &&
        !isBlank(form.pinCode),
    },
    {
      label: "Nominee details",
      done: !isBlank(form.nomineeName) && !isBlank(form.nomineeRelation),
    },
    { label: "Account identity", done: Boolean(user?.fullName && user?.email) },
  ];

  return (
    <div className="profile-page">
      <div className="profile-hero-card">
        <div>
          <span className="eyebrow">Customer Identity</span>
          <h1>
            {hasProfile
              ? "Keep your profile claim-ready."
              : "Complete your profile to unlock buying."}
          </h1>
          <p>
            Accurate personal, address, and nominee details make policy
            purchase, claims, and support smoother.
          </p>
        </div>
        <div className="profile-completion-card">
          <span>Profile Completion</span>
          <strong>{completion}%</strong>
          <div className="profile-progress">
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      <div className="profile-layout-grid">
        <aside className="profile-guidance-card">
          <div className="profile-avatar-card">
            <div className="profile-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <h3>{user?.fullName || "Customer"}</h3>
              <p>{user?.email || "Email not available"}</p>
            </div>
          </div>

          <dl className="profile-summary-list">
            <div>
              <dt>Role</dt>
              <dd>{formatLabel(user?.role || "CUSTOMER")}</dd>
            </div>
            <div>
              <dt>Account Status</dt>
              <dd>Active</dd>
            </div>
            <div>
              <dt>Calculated Age</dt>
              <dd>{age ? `${age} years` : "Add DOB"}</dd>
            </div>
            <div>
              <dt>KYC Readiness</dt>
              <dd>{completion === 100 ? "Complete" : "In Progress"}</dd>
            </div>
          </dl>

          <h3>Why this matters</h3>
          <ul>
            <li>Nominee details keep benefits clear for your family.</li>
            <li>Address and PIN help verify service availability.</li>
            <li>Date of birth confirms eligibility and policy rules.</li>
          </ul>

          <div className="readiness-checklist">
            <h3>Insurance readiness</h3>
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className={item.done ? "ready-item done" : "ready-item"}
              >
                <span>{item.done ? "✓" : "○"}</span>
                {item.label}
              </div>
            ))}
          </div>
        </aside>

        <Card title="Profile details">
          <Alert
            type="error"
            message={generalError}
            onClose={() => clearAll()}
          />
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />

          <form onSubmit={handleSubmit} noValidate>
            <h3 className="form-section-title">Personal verification</h3>
            <p className="form-section-hint">
              Use details exactly as you want them reflected on policies.
            </p>
            <div className="form-row">
              <Input
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                error={fieldErrors.dateOfBirth}
                max={TODAY}
              />
              <Input
                label="PIN Code"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                error={fieldErrors.pinCode}
                placeholder="226001"
                inputMode="numeric"
                maxLength={6}
              />
            </div>

            <h3 className="form-section-title">Communication address</h3>
            <p className="form-section-hint">
              This helps support and policy servicing teams identify your
              location.
            </p>
            <Input
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={fieldErrors.address}
              placeholder="House no, street, locality"
              maxLength={250}
            />

            <div className="form-row">
              <Input
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                error={fieldErrors.city}
                placeholder="Lucknow"
                maxLength={100}
              />
              <Select
                label="State / Union Territory"
                name="state"
                value={form.state}
                onChange={handleChange}
                error={fieldErrors.state}
                options={INDIAN_STATES}
                placeholder="Select state"
              />
            </div>

            <h3 className="form-section-title">Nominee information</h3>
            <p className="form-section-hint">
              Add the person who should be contacted for policy benefits if
              needed.
            </p>
            <div className="form-row">
              <Input
                label="Nominee Name"
                name="nomineeName"
                value={form.nomineeName}
                onChange={handleChange}
                error={fieldErrors.nomineeName}
                placeholder="Full name of nominee"
                maxLength={100}
              />
              <Select
                label="Nominee Relation"
                name="nomineeRelation"
                value={form.nomineeRelation}
                onChange={handleChange}
                error={fieldErrors.nomineeRelation}
                options={NOMINEE_RELATIONS}
                placeholder="Select relation"
              />
            </div>

            <Button type="submit" loading={saving}>
              {hasProfile ? "Save Changes" : "Create Profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
