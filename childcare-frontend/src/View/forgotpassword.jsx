import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Register.css";
import logo1 from "../images/logo1.png";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            Admin_email: email
          })
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "OTP sent successfully!");

        // Open OTP popup
        setStep(2);
        setShowOtpPopup(true);

      } else {
        alert(result.message || "Failed to send OTP.");
      }

    } catch (error) {
      console.error("OTP Error:", error);
      alert("Unable to connect to the server.");
    }
  };

const handleVerifyOTP = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Admin_email: email,
          otp: otp
        })
      }
    );

    const result = await response.json();

    if (response.ok) {
      alert(result.message || "OTP verified!");

      setShowOtpPopup(false);
      setShowResetPopup(true);
      setStep(3);
    } else {
      alert(result.message || "Invalid OTP.");
    }

  } catch (error) {
    console.error("Verify OTP Error:", error);
    alert("Unable to connect to the server.");
  }
};

const handleResetPassword = async (e) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Admin_email: email,
          otp: otp,
          new_password: newPassword
        })
      }
    );

    const result = await response.json();

    if (response.ok) {

      alert(result.message || "Password reset successfully!");

      navigate("/login");

    } else {

      alert(result.message || "Password reset failed.");

    }

  } catch (error) {

    console.error("Reset Password Error:", error);

    alert("Unable to connect to the server.");

  }
};
  


  return (
    <div className="login-page">

      <div className="login-container">

        {/* ================= LEFT SIDE ================= */}

        <div className="login-left">

          <img
            src={logo1}
            alt="ChildCare Logo"
            className="left-logo"
          />

        </div>


        {/* ================= RIGHT SIDE ================= */}

        <div className="login-right">

          <div className="login-content">

            <div className="brand">
              <h1>childcare</h1>
              <h2>Forgot Password</h2>
            </div>

            <p className="forgot-description">
              Enter your email address and we'll send you an OTP
              to reset your password.
            </p>


            {/* ================= EMAIL FORM ================= */}

            <form onSubmit={handleSendOTP}>

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />


              <div
                className="account-message"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </div>


              <button
                className="login-btn"
                type="submit"
              >
                SEND OTP
              </button>

            </form>

          </div>

        </div>

      </div>


      {/* ================================================= */}
      {/* ================= OTP POPUP ===================== */}
      {/* ================================================= */}

      {showOtpPopup && (

        <div className="otp-overlay">

          <div className="otp-popup">

            <button
              className="popup-close"
              onClick={() => setShowOtpPopup(false)}
            >
              ×
            </button>

            <h2>Verify OTP</h2>

            <p>
              Enter the 6-digit OTP sent to
              <br />
              <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOTP}>

              <label>OTP</label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                maxLength="6"
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                required
              />

              <button
                className="login-btn"
                type="submit"
              >
                VERIFY OTP
              </button>

            </form>

            <div className="resend-otp">
              Didn't receive the OTP? <span>Resend OTP</span>
            </div>

          </div>

        </div>

      )}


      {/* ================================================= */}
      {/* =============== RESET PASSWORD POPUP ============ */}
      {/* ================================================= */}

      {showResetPopup && (

        <div className="otp-overlay">

          <div className="otp-popup">

            <button
              className="popup-close"
              onClick={() => setShowResetPopup(false)}
            >
              ×
            </button>

            <h2>Reset Password</h2>

            <p>
              Create a new password for your account.
            </p>

            <form onSubmit={handleResetPassword}>

              <label>New Password</label>

              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
              />


              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />


              <button
                className="login-btn"
                type="submit"
              >
                RESET PASSWORD
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ForgotPassword;