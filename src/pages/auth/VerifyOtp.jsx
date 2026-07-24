import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authApi } from "../../api/authApi";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { extractErrorMessage } from "../../utils/validators";

const RESEND_WAIT = 30;
const OTP_REGEX = /^\d{6}$/;

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const otpChannel = location.state?.otpChannel;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!email || !otpChannel) {
      navigate("/register", { replace: true });
      return;
    }
    startCountdown();
    return () => clearInterval(intervalRef.current);
  }, []);

  const startCountdown = () => {
    setSecondsLeft(RESEND_WAIT);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((p) => {
        if (p <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
    setOtpError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!OTP_REGEX.test(otp)) {
      setOtpError("Enter the 6-digit code exactly as received");
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp({ email, otpChannel, otp });
      setSuccess("Account verified! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(extractErrorMessage(err, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      await authApi.resendOtp({ email, otpChannel });
      setSuccess(`New OTP sent via ${otpChannel}.`);
      startCountdown();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not resend OTP."));
    } finally {
      setResending(false);
    }
  };

  if (!email || !otpChannel) return null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">SC</div>
          <span className="auth-logo-name">SecureCover</span>
        </div>

        <h1 className="auth-title">
          Check your {otpChannel === "EMAIL" ? "inbox" : "phone"}
        </h1>
        <span className="auth-subtitle">
          We sent a 6-digit code via <strong>{otpChannel}</strong> to{" "}
          {otpChannel === "EMAIL" ? (
            <strong>{email}</strong>
          ) : (
            "your registered mobile number"
          )}
          . Enter it below to activate your account.
        </span>

        <Alert type="error" message={error} onClose={() => setError("")} />
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />

        <form onSubmit={handleVerify} noValidate>
          <Input
            label="Verification code"
            name="otp"
            value={otp}
            onChange={handleOtpChange}
            error={otpError}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            style={{
              fontSize: "1.5rem",
              letterSpacing: "0.25em",
              textAlign: "center",
            }}
          />
          <Button type="submit" fullWidth loading={loading}>
            Verify account
          </Button>
        </form>

        <div className="resend-row" style={{ marginTop: "1.25rem" }}>
          {secondsLeft > 0 ? (
            <span className="resend-timer">Resend code in {secondsLeft}s</span>
          ) : (
            <button
              className="link-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        <p className="auth-footer">
          Wrong details? <Link to="/register">Back to registration</Link>
        </p>
      </div>

      <div
        className="auth-image"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(5,150,105,0.7) 0%, rgba(11,17,32,0.7) 100%), url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80&auto=format&fit=crop')",
        }}
      >
        <p className="auth-image-quote">
          "One step away from complete protection"
        </p>
        <p className="auth-image-sub">
          Verify your identity to unlock full access to your insurance dashboard
        </p>
        <div className="auth-image-stats">
          <div>
            <span className="auth-stat-value">🔒</span>
            <span className="auth-stat-label">Secure OTP</span>
          </div>
          <div>
            <span className="auth-stat-value">5 min</span>
            <span className="auth-stat-label">Code validity</span>
          </div>
          <div>
            <span className="auth-stat-value">Free</span>
            <span className="auth-stat-label">All plans</span>
          </div>
        </div>
      </div>
    </div>
  );
}
