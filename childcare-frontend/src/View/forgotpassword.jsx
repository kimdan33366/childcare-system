import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/forgotpassword.css";
import logo1 from "../images/logo1.png";
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheck } from "react-icons/fa";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  // ==========================================
  // RESEND OTP COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);


  // ==========================================
  // SEND OTP
  // ==========================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            Admin_email: email,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "OTP sent successfully.");

        setStep(2);

        setResendCooldown(60);
      } else {
        setError(result.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("OTP Error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            Admin_email: email,
            otp: otp,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "OTP verified successfully.");

        setStep(3);
      } else {
        setError(result.message || "Invalid OTP.");
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            Admin_email: email,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "A new OTP has been sent.");

        setResendCooldown(60);
      } else {
        setError(result.message || "Failed to resend OTP.");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            Admin_email: email,
            otp: otp,
            new_password: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(
          result.message || "Password reset successfully."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(result.message || "Password reset failed.");
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // BACK BUTTON
  // ==========================================

  const handleBack = () => {
    if (step === 1) {
      navigate("/login");
    } else if (step === 2) {
      setStep(1);
      setOtp("");
      setMessage("");
      setError("");
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("");
      setError("");
    }
  };


  const titles = ["", "Forgot Password?", "Verify Your Email", "Reset Password"];
  const subtitles = ["", "Don't worry. We'll help you reset your password.", "Enter the verification code sent to your email.", "Choose a secure new password for your account."];

  return (
    <main className="forgot-page">
      <section className="forgot-container">
        <aside className="forgot-left">
          <div className="forgot-branding">
            <h1>childcare</h1>
            <p className="forgot-brand-subtitle">IMMUNIZATION SYSTEM</p>
            <p className="forgot-tagline">Together for<br />Healthier Generations</p>
            <span className="forgot-accent" />
          </div>
          <div className="forgot-illustration"><img src={logo1} alt="Childcare Immunization System" /></div>
          <div className="forgot-waves" aria-hidden="true"><span /><span /></div>
        </aside>

        <section className="forgot-right">
          <div className="forgot-content">
            <div className="forgot-header">
              <div className="forgot-mobile-brand">childcare <small>IMMUNIZATION SYSTEM</small></div>
              <h2>{titles[step]}</h2>
              <p>{subtitles[step]}</p>
            </div>
            <div className="step-indicator" aria-label={`Step ${step} of 3`}>
              {[1, 2, 3].map((number) => (
                <React.Fragment key={number}>
                  {number > 1 && <div className={`step-line ${step >= number ? "active" : ""}`} />}
                  <div className={`step ${step >= number ? "active" : ""}`}>
                    <div className="step-number">{step > number ? <FaCheck /> : number}</div>
                    <span>{["", "Email", "Verify OTP", "Reset"][number]}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {message && <div className="forgot-message success" role="status">{message}</div>}
            {error && <div className="forgot-message error" role="alert">{error}</div>}

            {step === 1 && (
              <div className="forgot-step-content">
                <div className="forgot-info"><FaEnvelope /><span>Enter your email address and we'll send you a 6-digit OTP to reset your password.</span></div>
                <form onSubmit={handleSendOTP}>
                  <label htmlFor="forgot-email">Email Address</label>
                  <div className="forgot-input-wrap"><FaEnvelope /><input id="forgot-email" type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <button className="forgot-btn" type="submit" disabled={loading}>{loading ? "Sending..." : "Send OTP"}<FaArrowRight /></button>
                </form>
                <button className="back-login-btn" type="button" onClick={() => navigate("/login")}><FaArrowLeft /> Back to Login</button>
              </div>
            )}

            {step === 2 && (
              <div className="forgot-step-content">
                <div className="forgot-info"><FaEnvelope /><span>We've sent a 6-digit verification code to <strong>{email}</strong></span></div>
                <form onSubmit={handleVerifyOTP}>
                  <label htmlFor="forgot-otp">Verification Code</label>
                  <div className="forgot-input-wrap"><FaShieldAlt /><input id="forgot-otp" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required /></div>
                  <button className="forgot-btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}<FaArrowRight /></button>
                </form>
                <div className="resend-container"><span>Didn't receive the code?</span>{resendCooldown > 0 ? <span className="resend-disabled">Resend in {resendCooldown}s</span> : <button className="resend-btn" type="button" disabled={loading} onClick={handleResendOTP}>Resend OTP</button>}</div>
                <button className="back-step-btn" type="button" onClick={handleBack}><FaArrowLeft /> Change Email</button>
              </div>
            )}

            {step === 3 && (
              <div className="forgot-step-content">
                <div className="forgot-info"><FaLock /><span>Create a new password to securely access your account.</span></div>
                <form onSubmit={handleResetPassword}>
                  <label htmlFor="forgot-new-password">New Password</label>
                  <div className="forgot-input-wrap password-field"><FaLock /><input id="forgot-new-password" type={showNewPassword ? "text" : "password"} placeholder="Enter new password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><button className="password-toggle" type="button" aria-label={showNewPassword ? "Hide password" : "Show password"} onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
                  <label htmlFor="forgot-confirm-password">Confirm Password</label>
                  <div className="forgot-input-wrap password-field"><FaLock /><input id="forgot-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /><button className="password-toggle" type="button" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
                  <button className="forgot-btn" type="submit" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}<FaArrowRight /></button>
                </form>
                <button className="back-step-btn" type="button" onClick={handleBack}><FaArrowLeft /> Back to OTP</button>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ForgotPassword;
