import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/forgotpassword.css";
import logo1 from "../images/logo1.png";

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


  return (
    <div className="forgot-page">

      <div className="forgot-container">

        {/* =====================================
            LEFT SIDE
        ====================================== */}

        <div className="forgot-left">

          <img
            src={logo1}
            alt="ChildCare Logo"
            className="forgot-logo"
          />

        </div>


        {/* =====================================
            RIGHT SIDE
        ====================================== */}

        <div className="forgot-right">

          <div className="forgot-content">

            {/* BRAND */}

            <div className="forgot-brand">

              <h1>childcare</h1>

              <h2>Forgot Password</h2>

            </div>


            {/* =================================
                STEP INDICATOR
            ================================== */}

            <div className="step-indicator">

              <div
                className={`step ${
                  step >= 1 ? "active" : ""
                }`}
              >
                <div className="step-number">
                  {step > 1 ? "✓" : "1"}
                </div>

                <span>Email</span>
              </div>


              <div
                className={`step-line ${
                  step >= 2 ? "active" : ""
                }`}
              ></div>


              <div
                className={`step ${
                  step >= 2 ? "active" : ""
                }`}
              >
                <div className="step-number">
                  {step > 2 ? "✓" : "2"}
                </div>

                <span>Verify OTP</span>
              </div>


              <div
                className={`step-line ${
                  step >= 3 ? "active" : ""
                }`}
              ></div>


              <div
                className={`step ${
                  step >= 3 ? "active" : ""
                }`}
              >
                <div className="step-number">
                  3
                </div>

                <span>Reset</span>
              </div>

            </div>


            {/* =================================
                MESSAGE
            ================================== */}

            {message && (
              <div className="forgot-message success">
                {message}
              </div>
            )}

            {error && (
              <div className="forgot-message error">
                {error}
              </div>
            )}


            {/* =================================
                STEP 1 — EMAIL
            ================================== */}

            {step === 1 && (

              <div className="forgot-step-content">

                <p className="forgot-description">
                  Enter your email address and we'll send
                  you a 6-digit OTP to reset your password.
                </p>

                <form onSubmit={handleSendOTP}>

                  <label>Email</label>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                  />

                  <button
                    className="forgot-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "SENDING..." : "SEND OTP"}
                  </button>

                </form>

                <button
                  className="back-login-btn"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>

              </div>

            )}


            {/* =================================
                STEP 2 — OTP
            ================================== */}

            {step === 2 && (

              <div className="forgot-step-content">

                <p className="forgot-description">
                  Enter the 6-digit OTP that was sent to
                  <br />

                  <strong>{email}</strong>
                </p>

                <form onSubmit={handleVerifyOTP}>

                  <label>Verification Code</label>

                  <input
                    type="text"
                    className="otp-input"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    maxLength="6"
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    required
                  />

                  <button
                    className="forgot-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "VERIFYING..."
                      : "VERIFY OTP"}
                  </button>

                </form>


                <div className="resend-container">

                  <span>
                    Didn't receive the OTP?
                  </span>

                  {resendCooldown > 0 ? (

                    <span className="resend-disabled">
                      Resend in {resendCooldown}s
                    </span>

                  ) : (

                    <button
                      className="resend-btn"
                      onClick={handleResendOTP}
                    >
                      Resend OTP
                    </button>

                  )}

                </div>


                <button
                  className="back-step-btn"
                  onClick={handleBack}
                >
                  ← Change Email
                </button>

              </div>

            )}


            {/* =================================
                STEP 3 — RESET PASSWORD
            ================================== */}

            {step === 3 && (

              <div className="forgot-step-content">

                <p className="forgot-description">
                  Create a new password for your account.
                </p>

                <form onSubmit={handleResetPassword}>

                  {/* NEW PASSWORD */}

                  <label>New Password</label>

                  <div className="password-field">

                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <label>Confirm Password</label>

                  <div className="password-field">

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>


                  <button
                    className="forgot-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "RESETTING..."
                      : "RESET PASSWORD"}
                  </button>

                </form>


                <button
                  className="back-step-btn"
                  onClick={handleBack}
                >
                  ← Back to OTP
                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;

