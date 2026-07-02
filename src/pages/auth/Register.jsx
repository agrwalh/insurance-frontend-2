import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { OTP_CHANNELS } from "../../utils/constants";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isValidEmail, isValidMobile, isValidPersonName, passwordStrength } from "../../utils/validators";

const initialForm = { fullName: "", email: "", password: "", confirmPassword: "", mobileNumber: "", otpChannel: "" };

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError } = useFormErrors();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === "mobileNumber" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [name]: v }));
    clearFieldError(name);
  };

  const validate = () => {
    const errors = {};
    if (isBlank(form.fullName)) errors.fullName = "Full name is required";
    else if (!isValidPersonName(form.fullName)) errors.fullName = "Use a real name with letters, spaces, apostrophes or hyphens only";
    if (isBlank(form.email)) errors.email = "Email is required";
    else if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";
    const s = passwordStrength(form.password);
    if (!s.valid) errors.password = s.message;
    if (isBlank(form.confirmPassword)) errors.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords don't match";
    if (isBlank(form.mobileNumber)) errors.mobileNumber = "Mobile number is required";
    else if (!isValidMobile(form.mobileNumber)) errors.mobileNumber = "Enter a valid 10-digit number";
    if (isBlank(form.otpChannel)) errors.otpChannel = "Choose how to verify your account";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAll();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([f, m]) => setFieldError(f, m));
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), password: form.password, mobileNumber: form.mobileNumber, otpChannel: form.otpChannel });
      navigate("/verify-otp", { state: { email: form.email.trim().toLowerCase(), otpChannel: form.otpChannel } });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ overflowY: "auto" }}>
        <div className="auth-logo">
          <div className="auth-logo-mark">SC</div>
          <span className="auth-logo-name">SecureCover</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <span className="auth-subtitle">Start protecting what matters most to you</span>

        <Alert type="error" message={generalError} onClose={clearAll} />

        <form onSubmit={handleSubmit} noValidate>
          <Input label="Full name" name="fullName" value={form.fullName} onChange={handleChange} error={fieldErrors.fullName} placeholder="Harsh Verma" maxLength={100} required />
          <Input label="Email address" name="email" type="email" value={form.email} onChange={handleChange} error={fieldErrors.email} placeholder="you@example.com" required />
          <div className="form-row">
            <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={fieldErrors.password} placeholder="Upper, lower, number & symbol" required />
            <Input label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={fieldErrors.confirmPassword} placeholder="Repeat password" required />
          </div>
          <Input label="Mobile number" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} error={fieldErrors.mobileNumber} placeholder="9876543210" inputMode="numeric" maxLength={10} required />
          <Select label="Verify account via" name="otpChannel" value={form.otpChannel} onChange={handleChange} error={fieldErrors.otpChannel} options={OTP_CHANNELS} placeholder="Choose verification method" required />
          <Button type="submit" fullWidth loading={loading}>Create account</Button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className="auth-image" style={{
        backgroundImage: "linear-gradient(135deg, rgba(5,150,105,0.75) 0%, rgba(11,17,32,0.65) 100%), url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format&fit=crop')"
      }}>
        <p className="auth-image-quote">"The best time to get insured is before you need it"</p>
        <p className="auth-image-sub">Complete your registration in under 2 minutes and get covered today</p>
        <div className="auth-image-stats">
          <div><span className="auth-stat-value">4</span><span className="auth-stat-label">Plan Types</span></div>
          <div><span className="auth-stat-value">24h</span><span className="auth-stat-label">Support</span></div>
          <div><span className="auth-stat-value">100%</span><span className="auth-stat-label">Digital</span></div>
        </div>
      </div>
    </div>
  );
}
