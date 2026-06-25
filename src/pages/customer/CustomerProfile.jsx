import { useState, useEffect } from "react";
import { customerApi } from "../../api/customerApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isValidPinCode, isAtLeast18YearsOld, isRealisticDob, isPastOrToday } from "../../utils/validators";

const emptyForm = {
  dateOfBirth: "", address: "", city: "", state: "", pinCode: "", nomineeName: "", nomineeRelation: "",
};

const TODAY = new Date().toISOString().split("T")[0];

export default function CustomerProfile() {
  const [form, setForm] = useState(emptyForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError, setGeneralError } = useFormErrors();

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
    const cleanedValue = name === "pinCode" ? value.replace(/\D/g, "").slice(0, 6) : value;
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
    } else if (form.address.trim().length < 5) {
      errors.address = "Address seems too short";
    }

    if (isBlank(form.city)) errors.city = "City is required";
    if (isBlank(form.state)) errors.state = "State is required";

    if (isBlank(form.pinCode)) {
      errors.pinCode = "PIN code is required";
    } else if (!isValidPinCode(form.pinCode)) {
      errors.pinCode = "Enter a valid 6-digit PIN code";
    }

    if (isBlank(form.nomineeName)) {
      errors.nomineeName = "Nominee name is required";
    } else if (form.nomineeName.trim().length < 2) {
      errors.nomineeName = "Nominee name seems too short";
    }

    if (isBlank(form.nomineeRelation)) errors.nomineeRelation = "Nominee relation is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAll();
    setSuccess("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
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

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="page-subtitle">
          {hasProfile ? "Update your details below" : "Complete your profile to start buying policies"}
        </p>
      </div>

      <Card>
        <Alert type="error" message={generalError} onClose={() => clearAll()} />
        <Alert type="success" message={success} onClose={() => setSuccess("")} />

        <form onSubmit={handleSubmit} noValidate>
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
            <Input label="City" name="city" value={form.city} onChange={handleChange} error={fieldErrors.city} placeholder="Lucknow" maxLength={100} />
            <Input label="State" name="state" value={form.state} onChange={handleChange} error={fieldErrors.state} placeholder="Uttar Pradesh" maxLength={100} />
          </div>

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
            <Input
              label="Nominee Relation"
              name="nomineeRelation"
              value={form.nomineeRelation}
              onChange={handleChange}
              error={fieldErrors.nomineeRelation}
              placeholder="e.g. Spouse, Parent"
              maxLength={50}
            />
          </div>

          <Button type="submit" loading={saving}>
            {hasProfile ? "Save Changes" : "Create Profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
