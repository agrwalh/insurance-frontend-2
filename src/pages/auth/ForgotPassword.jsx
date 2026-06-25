import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import Select from "../../components/common/Select";
import { extractErrorMessage, isBlank, isValidEmail, passwordStrength } from "../../utils/validators";

const OTP_CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    otpChannel: "EMAIL",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errors = {};
    if (isBlank(form.email)) errors.email = "Email is required";
    else if (!isValidEmail(form.email)) errors.email = "Enter a valid email";
    if (isBlank(form.otpChannel)) errors.otpChannel = "Choose OTP channel";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: form.email.trim().toLowerCase(), otpChannel: form.otpChannel });
      setSuccess(`OTP sent via ${form.otpChannel}. Enter it below with your new password.`);
      setStep(2);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not send reset OTP."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errors = {};
    if (!/^\d{6}$/.test(form.otp)) errors.otp = "Enter 6-digit OTP";
    const strength = passwordStrength(form.newPassword);
    if (!strength.valid) errors.newPassword = strength.message;
    if (form.confirmPassword !== form.newPassword) errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: form.email.trim().toLowerCase(),
        otpChannel: form.otpChannel,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not reset password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">SC</div>
          <span className="auth-logo-name">SecureCover</span>
        </div>

        <h1 className="auth-title">Reset your password</h1>
        <span className="auth-subtitle">
          {step === 1 ? "Enter your account email to receive a reset OTP." : "Enter the OTP and choose a new password."}
        </span>

        <Alert type="error" message={error} onClose={() => setError("")} />
        <Alert type="success" message={success} onClose={() => setSuccess("")} />

        {step === 1 ? (
          <form onSubmit={requestOtp} noValidate>
            <Input label="Email address" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} error={fieldErrors.email} placeholder="you@example.com" />
            <Select label="Send OTP via" value={form.otpChannel} onChange={(e) => update("otpChannel", e.target.value)} error={fieldErrors.otpChannel} options={OTP_CHANNELS} />
            <Button type="submit" fullWidth loading={loading}>Send reset OTP</Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} noValidate>
            <Input label="Email address" value={form.email} disabled />
            <Input label="OTP" value={form.otp} onChange={(e) => update("otp", e.target.value.replace(/\D/g, "").slice(0, 6))} error={fieldErrors.otp} placeholder="123456" inputMode="numeric" maxLength={6} />
            <Input label="New Password" type="password" value={form.newPassword} onChange={(e) => update("newPassword", e.target.value)} error={fieldErrors.newPassword} placeholder="New password" />
            <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} error={fieldErrors.confirmPassword} placeholder="Confirm new password" />
            <Button type="submit" fullWidth loading={loading}>Reset password</Button>
            <button type="button" className="link-btn" style={{ marginTop: "1rem" }} onClick={() => setStep(1)}>Change email / resend OTP</button>
          </form>
        )}

        <p className="auth-footer">
          Remembered password? <Link to="/login">Back to login</Link>
        </p>
      </div>
      <div className="auth-image">
        <p className="auth-image-quote">"Secure recovery for your protection account"</p>
        <p className="auth-image-sub">Reset access safely using OTP verification</p>
      </div>
    </div>
  );
}