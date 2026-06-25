import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { useFormErrors } from "../../hooks/useFormErrors";
import { isBlank, isValidEmail } from "../../utils/validators";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { fieldErrors, generalError, setFieldError, clearFieldError, clearAll, handleApiError } = useFormErrors();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearFieldError(e.target.name);
  };

  const validate = () => {
    const errors = {};
    if (isBlank(form.email)) errors.email = "Email is required";
    else if (!isValidEmail(form.email)) errors.email = "Enter a valid email address";
    if (isBlank(form.password)) errors.password = "Password is required";
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
      const u = await login(form.email.trim().toLowerCase(), form.password);
      navigate(u.role === "ADMIN" ? "/admin/dashboard" : u.role === "AGENT" ? "/agent/dashboard" : "/customer/dashboard");
    } catch (err) {
      handleApiError(err);
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

        <h1 className="auth-title">Welcome back</h1>
        <span className="auth-subtitle">Sign in to access your insurance dashboard</span>

        <Alert type="error" message={generalError} onClose={clearAll} />

        <form onSubmit={handleSubmit} noValidate>
          <Input label="Email address" name="email" type="email" value={form.email}
            onChange={handleChange} error={fieldErrors.email} placeholder="you@example.com" />
          <Input label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} error={fieldErrors.password} placeholder="Your password" />
          <div style={{ textAlign: "right", margin: "-0.45rem 0 0.85rem" }}>
            <Link className="link-btn" to="/forgot-password">Forgot password?</Link>
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <Button type="submit" fullWidth loading={loading}>Sign in</Button>
          </div>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
      <div className="auth-image">
        <p className="auth-image-quote">
          "Protecting what matters most — family, health, and your future"
        </p>
        <p className="auth-image-sub">Join thousands of customers managing their policies with SecureCover</p>
        <div className="auth-image-stats">
          <div>
            <span className="auth-stat-value">50K+</span>
            <span className="auth-stat-label">Policies Active</span>
          </div>
          <div>
            <span className="auth-stat-value">₹2B+</span>
            <span className="auth-stat-label">Claims Settled</span>
          </div>
          <div>
            <span className="auth-stat-value">98%</span>
            <span className="auth-stat-label">Satisfaction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
